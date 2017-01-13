import fs from 'fs'
import path from 'path'
import xml2js from 'xml2js'
import zlib from 'zlib'
import { TEMPLATE } from '../constants/clip'
import * as utils from '../utils'
import decrypt from '../utils/license'

const AUTOMATION_OFFSET = 331
const INITIAL_AUTOMATION = -63072000
const CLIP_PATH = [
    'Ableton', 'LiveSet', 0, 'Tracks', 0, 'MidiTrack', 0, 'DeviceChain', 0,
    'MainSequencer', 0, 'ClipSlotList', 0, 'ClipSlot', 0, 'ClipSlot', 0,
    'Value', 0, 'MidiClip', 0
]
const ENVELOPES_PATH = CLIP_PATH.concat(['Envelopes', 0, 'Envelopes'])
const NAME_PATH = CLIP_PATH.concat(['Name', 0])
const LOOP_PATH = CLIP_PATH.concat(['Loop', 0])
const PATH_DATA_PATH = CLIP_PATH.concat(['Bezie', 0, 'PathData', 0])
const ZOOM_X_PATH = CLIP_PATH.concat(['Bezie', 0, 'ZoomX', 0])
const ZOOM_Y_PATH = CLIP_PATH.concat(['Bezie', 0, 'ZoomY', 0])
const BARS_PATH = CLIP_PATH.concat(['Bezie', 0, 'Bars', 0])
const CURRENT_END_PATH = CLIP_PATH.concat(['CurrentEnd', 0])
const INVALID_FILE_MESSAGE = 'Oops! This file was not created with Bezie.'

export function save (sender, filename, { paths, height, zoom, bars, authorized, license }) {
    if (decrypt(license.key, license.secret) !== license.email) return

    xml2js.parseString(TEMPLATE, (err, clip) => {
        const builder = new xml2js.Builder()
        const envelopes = _.get(clip, ENVELOPES_PATH)
        const name = _.get(clip, NAME_PATH)
        const pathData = _.get(clip, PATH_DATA_PATH)
        const zoomX = _.get(clip, ZOOM_X_PATH)
        const zoomY = _.get(clip, ZOOM_Y_PATH)
        const barsNode = _.get(clip, BARS_PATH)
        const currentEnd = _.get(clip, CURRENT_END_PATH)
        const loop = _.get(clip, LOOP_PATH)
        const length = bars * 4

        // Set name
        name.$ = { Value: path.parse(filename).name }

        // Add paths
        pathData.$ = { Value: Buffer.from(JSON.stringify(paths), 'utf8').toString('base64') }

        // Add zoom
        zoomX.$ = { Value: zoom.x }
        zoomY.$ = { Value: zoom.y }

        // Set bars
        barsNode.$ = { Value: bars }
        currentEnd.$ = { Value: length }
        loop.LoopEnd[0].$ = { Value: length }
        loop.OutMarker[0].$ = { Value: length }
        loop.HiddenLoopEnd[0].$ = { Value: length }

        // Remove empty string
        envelopes.pop()
        envelopes.push({ ClipEnvelope: [] })

        // Set automation
        _.each(paths, (points, i) => {
            const events = [{
                FloatEvent: [{ $: { Time: INITIAL_AUTOMATION, Value: 0 } }]
            }]

            _.each(points, point => {
                const normalized = utils.normalizePoint({ point, height, zoom })
                events[0].FloatEvent.push({
                    $: {
                        Time: normalized.x,
                        Value: normalized.y,
                    },
                })
            })

            envelopes[0].ClipEnvelope.push({
                EnvelopeTarget: [{
                    PointeeId: {
                        $: { Value: i + AUTOMATION_OFFSET },
                    },
                }],
                Automation: [{ Events: events }],
                LoopSlot: [{ Value: {} }],
                ScrollerTimePreserver: [{
                    LeftTime: { $: { Value: 0 } },
                    RightTime: { $: { Value: 0 } },
                }],
            })
        })

        if (authorized) fs.writeFile(filename, zlib.gzipSync(builder.buildObject(clip)))
    })
}

export function open (sender, filename, { bootstrap, authorized, license }) {
    if (decrypt(license.key, license.secret) !== license.email) return

    fs.readFile(filename, (e, data) => {
        xml2js.parseString(zlib.gunzipSync(data), (err, clip) => {
            if (!_.has(clip, PATH_DATA_PATH)) {
                return alert(INVALID_FILE_MESSAGE) // eslint-disable-line
            }

            const pathData = _.get(clip, PATH_DATA_PATH)
            const pathJson = Buffer.from(pathData.$.Value, 'base64').toString('utf8')
            const zoomX = _.get(clip, ZOOM_X_PATH)
            const zoomY = _.get(clip, ZOOM_Y_PATH)
            const bars = _.get(clip, BARS_PATH)

            if (authorized) {
                bootstrap({
                    bars: parseInt(bars.$.Value, 10),
                    paths: JSON.parse(pathJson),
                    zoom: {
                        x: parseFloat(zoomX.$.Value),
                        y: parseFloat(zoomY.$.Value),
                    },
                })
            }
        })
    })
}
