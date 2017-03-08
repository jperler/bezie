import _ from 'lodash'
import midi from 'midi'
import {
    VIRTUAL_PORT_NAME,
    WIN_MIDI_ERROR,
} from '../constants'

class Midi {
    constructor () {
        this.output = new midi.output()
        this.input = new midi.input()
        this.controller = new midi.input()

        this._isConnected = false
        this._hasController = false

        // Enable timing events
        this.input.ignoreTypes(true, false, true)
    }

    connectVirtualPorts () {
        const isWin = /^win/.test(process.platform)

        if (isWin) {
            const numOutputs = this.output.getPortCount()
            const numInputs = this.input.getPortCount()
            const outputPortIndex = _.find(_.range(numOutputs), i => (
                this.output.getPortName(i) === VIRTUAL_PORT_NAME
            ))
            const inputPortIndex = _.find(_.range(numInputs), i => (
                this.input.getPortName(i) === VIRTUAL_PORT_NAME
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

            if (name === VIRTUAL_PORT_NAME) return

            return {
                index: i,
                label: this.input.getPortName(i),
            }
        }))
    }

    setController (e) {
        const value = parseInt(e.target.value, 10)
        const index = _.isNaN(value) ? undefined : value

        if (!_.isUndefined(index)) {
            this.controller.openPort(index)
            this._hasController = true
        } else {
            this._hasController = false
        }
    }

    isConnected () {
        return this._isConnected
    }

    hasController () {
        return this._hasController
    }
}

module.exports = new Midi()
