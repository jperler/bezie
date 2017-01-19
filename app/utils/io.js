import fs from 'fs'
import path from 'path'
import xml2js from 'xml2js'
import zlib from 'zlib'
import { TEMPLATE } from '../constants/clip'
import * as utils from '../utils'
import decrypt from '../utils/license'

const AUTOMATION_OFFSET = 331
const INITIAL_AUTOMATION = -63072000
const INVALID_FILE_MESSAGE = 'Oops! This file was not created with Bezie.'

const getPaths = (xpath = []) => ({
    ENVELOPES: xpath.concat(['Envelopes', 0, 'Envelopes']),
    NAME: xpath.concat(['Name', 0]),
    LOOP: xpath.concat(['Loop', 0]),
    PATH_DATA: xpath.concat(['Bezie', 0, 'PathData', 0]),
    ZOOM_X: xpath.concat(['Bezie', 0, 'ZoomX', 0]),
    ZOOM_Y: xpath.concat(['Bezie', 0, 'ZoomY', 0]),
    BARS: xpath.concat(['Bezie', 0, 'Bars', 0]),
    CURRENT_END: xpath.concat(['CurrentEnd', 0]),
})

export function save (sender, filename, { paths, height, zoom, bars, authorized, license }) {
    if (!license.xpath && decrypt(license.key, license.secret) !== license.email) return

    const xpath = JSON.parse(Buffer.from(license.xpath, 'base64').toString('utf8'))
    const { ENVELOPES, NAME, LOOP, PATH_DATA, ZOOM_X, ZOOM_Y, BARS, CURRENT_END } = getPaths(xpath)

    xml2js.parseString(TEMPLATE, (err, clip) => {
        const builder = new xml2js.Builder()
        const envelopes = _.get(clip, ENVELOPES)
        const name = _.get(clip, NAME)
        const pathData = _.get(clip, PATH_DATA)
        const zoomX = _.get(clip, ZOOM_X)
        const zoomY = _.get(clip, ZOOM_Y)
        const barsNode = _.get(clip, BARS)
        const currentEnd = _.get(clip, CURRENT_END)
        const loop = _.get(clip, LOOP)
        const length = bars

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
    if (!license.xpath && decrypt(license.key, license.secret) !== license.email) return

    const xpath = JSON.parse(Buffer.from(license.xpath, 'base64').toString('utf8'))
    const { PATH_DATA, ZOOM_X, ZOOM_Y, BARS } = getPaths(xpath)

    fs.readFile(filename, (e, data) => {
        xml2js.parseString(zlib.gunzipSync(data), (err, clip) => {
            if (!_.has(clip, PATH_DATA)) {
                return alert(INVALID_FILE_MESSAGE) // eslint-disable-line
            }

            const pathData = _.get(clip, PATH_DATA)
            const pathJson = Buffer.from(pathData.$.Value, 'base64').toString('utf8')
            const zoomX = _.get(clip, ZOOM_X)
            const zoomY = _.get(clip, ZOOM_Y)
            const bars = _.get(clip, BARS)

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
