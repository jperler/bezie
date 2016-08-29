import fs from 'fs'
import path from 'path'
import xml2js from 'xml2js'
import zlib from 'zlib'
import { PPQ } from '../constants'
import { TEMPLATE } from '../constants/clip'

const AUTOMATION_OFFSET = 331
const INITIAL_AUTOMATION = -63072000
const CLIP_PATH = [
    'Ableton', 'LiveSet', 0, 'Tracks', 0, 'MidiTrack', 0, 'DeviceChain', 0,
    'MainSequencer', 0, 'ClipSlotList', 0, 'ClipSlot', 0, 'ClipSlot', 0,
    'Value', 0, 'MidiClip', 0
]
const ENVELOPES_PATH = CLIP_PATH.concat(['Envelopes', 0, 'Envelopes'])
const NAME_PATH = CLIP_PATH.concat(['Name', 0])

export function save (sender, filename, { paths, height, zoom }) {
    xml2js.parseString(TEMPLATE, (err, clip) => {
        let builder = new xml2js.Builder()
        let envelopes = _.get(clip, ENVELOPES_PATH)
        let name = _.get(clip, NAME_PATH)

        // Set name
        name.$ = { Value: path.parse(filename).name }

        // Remove empty string
        envelopes.pop()
        envelopes.push({ ClipEnvelope: [] })

        // Set automation
        _.each(paths, (path, i) => {
            let events = [{
                FloatEvent: [{ $: { Time: INITIAL_AUTOMATION, Value: 0 }}]
            }]

            _.each(path, point => {
                events[0].FloatEvent.push({
                    $: {
                        Time: point.x / zoom.x / PPQ,
                        Value: (height - point.y) / zoom.y,
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

        fs.writeFile(filename, zlib.gzipSync(builder.buildObject(clip)))
    })
}
