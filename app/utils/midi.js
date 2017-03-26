import _ from 'lodash'
import midi from 'midi'
import {
    VIRTUAL_PORT_NAME,
    WIN_MIDI_ERROR,
    CONTROL_MAX,
    PITCH_MAX,
} from '../constants'

import { PITCH } from '../constants/midi'

const pitchScale = d3.scale
    .linear()
    .domain([0, CONTROL_MAX])
    .range([0, PITCH_MAX])

class Midi {

    constructor () {
        this.output = new midi.output()
        this.input = new midi.input()

        this.controllers = {}
        this.controller = null
        this.initControllers()

        this._isConnected = false

        // Enable timing events
        this.input.ignoreTypes(true, false, true)
    }

    connectVirtualPorts () {
        const isWin = /^win/.test(process.platform)

        if (isWin) {
            const numOutputs = this.output.getPortCount()
            const numInputs = this.input.getPortCount()
            const outputPortIndex = _.find(_.range(numOutputs), i => (
                _.includes(_.toLower(this.output.getPortName(i)), _.toLower(VIRTUAL_PORT_NAME))
            ))
            const inputPortIndex = _.find(_.range(numInputs), i => (
                _.includes(_.toLower(this.input.getPortName(i)), _.toLower(VIRTUAL_PORT_NAME))
            ))

            if (_.isNumber(inputPortIndex) && _.isNumber(outputPortIndex)) {
                this.output.openPort(outputPortIndex)
                this.input.openPort(inputPortIndex)
                this._isConnected = true
            } else {
                alert(WIN_MIDI_ERROR) // eslint-disable-line
            }
        } else {
            this.output.openVirtualPort(VIRTUAL_PORT_NAME)
            this.input.openVirtualPort(VIRTUAL_PORT_NAME)
            this._isConnected = true
        }
    }

    getControllers () {
        return _.compact(_.map(_.range(this.input.getPortCount()), i => {
            const name = this.input.getPortName(i)

            // Make sure to do includes based on how windows names it's virtual midi ports
            if (_.includes(_.toLower(name), _.toLower(VIRTUAL_PORT_NAME)) || !name) return

            return {
                index: i,
                label: name,
            }
        }))
    }

    getControllerName (i) {
        return this.input.getPortName(i)
    }

    findController (data) {
        return _.find(this.getControllers(), data)
    }

    initControllers () {
        // Open all controllers
        _.each(this.getControllers(), controller => {
            // Only add it if it doesn't yet exist
            if (!this.controllers[controller.label]) {
                const input = new midi.input()
                input.openPort(controller.index)
                this.controllers[controller.label] = input
            }
        })
    }

    setController (index) {
        // Remove current controllers events
        if (this.controller) this.controller.removeAllListeners('message')

        // Unset current controller
        if (_.isNull(index)) {
            this.controller = null
            return
        }

        // Set new controller
        const name = this.getControllerName(index)
        this.controller = this.controllers[name]
    }

    isConnected () {
        return this._isConnected
    }

    hasController () {
        return !!this.controller
    }

    getChannelName (n) {
        return n === PITCH ? 'Pitch' : `Channel ${n}`
    }

    getScaledPitch = _.memoize(n => _.round(pitchScale(n)))
    normalizePitch = n => this.getScaledPitch(n) - (PITCH_MAX + 1) / 2
    getPitchValue = _.memoize(n => {
        const scaled = this.getScaledPitch(n)
        return [scaled & 0x7F, scaled >> 7]
    })
}

module.exports = new Midi()
