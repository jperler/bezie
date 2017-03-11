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

        this.controllers = {}
        this.controllerIdx = null
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
}

module.exports = new Midi()
