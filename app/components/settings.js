import React, { Component, PropTypes } from 'react'
import Immutable from 'seamless-immutable'
import _ from 'lodash'
import fs from 'fs'
import { noteNumberToName } from 'midiutils'
import {
    ControlLabel,
    InputGroup,
    Form,
    ButtonToolbar,
    Button,
    FormGroup,
    FormControl,
} from 'react-bootstrap'
import { modes, colors, NUM_CC_CHANNELS } from '../constants'
import { default as midiUtil } from '../utils/midi'

const { dialog } = require('electron').remote

export default class Settings extends Component {
    static propTypes = {
        updateSettings: PropTypes.func.isRequired,
        settings: PropTypes.shape({
            midi: PropTypes.array.isRequired,
            tempo: PropTypes.number.isRequired,
            mappings: PropTypes.object.isRequired,
            mode: PropTypes.oneOf(_.values(modes)).isRequired,
            controllerName: PropTypes.string,
        }),
    }

    constructor (props) {
        super()
        this.state = props.settings
    }

    componentWillMount () {
        // Refresh controllers every 5 seconds
        this.refreshInterval = setInterval(::this.refreshControllers, 5e3)
    }

    componentWillUnmount () {
        clearInterval(this.refreshInterval)
    }

    onChannelChange (e, pathIdx) {
        const { midi } = this.state
        const channel = parseInt(e.target.value, 10)

        this.setState({ midi: midi.setIn([pathIdx, 'channel'], channel) })
    }

    onNameChange (e, pathIdx) {
        const { midi } = this.state
        const name = e.target.value

        this.setState({ midi: midi.setIn([pathIdx, 'name'], name) })
    }

    onSaveClick () {
        this.props.updateSettings({
            midi: this.state.midi,
            tempo: this.state.tempo,
            mappings: this.state.mappings,
            mode: this.state.mode,
            controllerName: this.state.controllerName,
        })
        window.location = '#/'
    }

    onTempoChange (e) {
        this.setState({ tempo: parseInt(e.target.value, 10) })
    }

    onControllerChange (e) {
        const value = parseInt(e.target.value, 10)
        const isNone = _.isNaN(value)
        const index = isNone ? null : value
        const controllerName = isNone ? null : midiUtil.getControllerName(index)

        midiUtil.setController(index)

        this.setState({ controllerName })
    }

    onMIDILearnClick (pathIdx) {
        const { mappings } = this.state

        if (!midiUtil.hasController()) return

        // If clicking learn again before setting mapping
        if (this.activeListener) {
            midiUtil.controller.removeListener('message', this.activeListener)
            this.activeListener = null
        }

        const listener = this.activeListener = (deltaTime, message) => {
            const code = [message[0], message[1]].join('.')
            this.setState({ mappings: mappings.set(pathIdx, code) })
            this.activeListener = null
            midiUtil.controller.removeListener('message', listener)
        }

        midiUtil.controller.on('message', listener)
    }

    onMIDIUnlearnClick (pathIdx) {
        const { mappings } = this.state
        this.setState({ mappings: mappings.set(pathIdx, undefined) })
    }

    onSavePresetClick () {
        const { midi } = this.state

        dialog.showSaveDialog({
            filters: [
                { name: 'Bezie Preset', extensions: ['preset'] },
            ],
        }, filename => {
            if (filename) {
                const data = { settings: { midi } }
                fs.writeFile(filename, JSON.stringify(data))
            }
        })
    }

    onLoadPresetClick () {
        const INVALID_FILE_MESSAGE = 'Oops! This preset is invalid.'
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Bezie Preset', extensions: ['preset'] },
            ],
        }, (paths = []) => {
            const filename = paths[0]
            if (filename) {
                fs.readFile(filename, (error, json) => {
                    let settings = {}
                    let isValid = true

                    try {
                        settings = JSON.parse(json).settings
                    } catch (e) {
                        alert(INVALID_FILE_MESSAGE) // eslint-disable-line
                        isValid = false
                    }

                    if (!_.has(settings, 'midi')) {
                        alert(INVALID_FILE_MESSAGE) // eslint-disable-line
                        isValid = false
                    }

                    if (isValid) this.setState({ midi: Immutable(settings.midi) })
                })
            }
        })
    }

    onModeChange (e) {
        this.setState({ mode: e.target.value })
    }

    getMapLabel (index) {
        const value = this.state.mappings[index]

        if (!value) return ''

        const data = value.split('.')
        const type = parseInt(data[0], 10)
        const note = parseInt(data[1], 10)
        const label = noteNumberToName(note)
        const noteOnRange = _.range(144, 160)

        return _.includes(noteOnRange, type) ? `Note: ${label}` : value
    }

    refreshControllers () {
        midiUtil.initControllers()
        this.forceUpdate()
    }

    render () {
        const { midi, mode } = this.state
        const currentChannels = _.map(midi, 'channel')
        const controller = midiUtil.findController({
            label: this.state.controllerName,
        })

        return (
            <div>
                <div className="pull-left">
                    {this.props.settings.midi.map((config, pathIdx) => (
                        <Form inline key={pathIdx} className="push-bottom-xsmall">
                            <FormGroup>
                                <InputGroup>
                                    <InputGroup.Addon>
                                        <i
                                            className="fa fa-square"
                                            style={{ color: colors[pathIdx] }}
                                        />
                                    </InputGroup.Addon>
                                    <FormControl
                                        type="text"
                                        label="Text"
                                        placeholder={`Channel ${midi[pathIdx].channel}`}
                                        value={midi[pathIdx].name}
                                        maxLength={25}
                                        onChange={_.partial(::this.onNameChange, _, pathIdx)}
                                    />
                                </InputGroup>
                            </FormGroup>
                            <FormGroup className="push-left-xsmall">
                                <FormControl
                                    componentClass="select"
                                    value={midi[pathIdx].channel}
                                    onChange={_.partial(::this.onChannelChange, _, pathIdx)}
                                >
                                    {_.map(_.range(NUM_CC_CHANNELS), i => (
                                        <option
                                            key={i + 1}
                                            value={i + 1}
                                            disabled={_.includes(currentChannels, i + 1)}
                                        >
                                            Channel {i + 1}
                                        </option>
                                    ))}
                                </FormControl>
                            </FormGroup>
                            {mode === modes.controller &&
                                <FormGroup className="push-left-xsmall">
                                    <InputGroup>
                                        <InputGroup.Addon>
                                            <Button
                                                bsSize="xsmall"
                                                style={{ fontSize: '11px' }}
                                                onClick={() => this.onMIDILearnClick(pathIdx)}
                                            >
                                                Learn
                                            </Button>
                                        </InputGroup.Addon>
                                        <FormControl
                                            type="text"
                                            disabled
                                            value={this.getMapLabel(pathIdx)}
                                            onChange={_.noop}
                                        />
                                        <InputGroup.Addon>
                                            <Button
                                                style={{ fontSize: 11 }}
                                                bsSize="xsmall"
                                                disabled={!this.getMapLabel(pathIdx)}
                                                onClick={() => this.onMIDIUnlearnClick(pathIdx)}
                                            >
                                                <i className="fa fa-close" />
                                            </Button>
                                        </InputGroup.Addon>
                                    </InputGroup>
                                </FormGroup>
                            }
                        </Form>
                    ))}
                    <ButtonToolbar className="push-top">
                        <Button
                            bsSize="small"
                            onClick={::this.onSaveClick}
                        >
                            Update
                        </Button>
                        <Button
                            bsSize="small"
                            onClick={() => window.location = '#/'}
                        >
                            Cancel
                        </Button>
                        <Button
                            bsSize="small"
                            onClick={::this.onSavePresetClick}
                        >
                            Save Preset
                        </Button>
                        <Button
                            bsSize="small"
                            onClick={::this.onLoadPresetClick}
                        >
                            Load Preset
                        </Button>
                    </ButtonToolbar>
                </div>
                <div className="pull-left push-left" style={{ width: 200 }}>
                    <Form>
                        <FormGroup>
                            <ControlLabel>Mode</ControlLabel>
                            <FormControl
                                componentClass="select"
                                value={this.state.mode}
                                onChange={::this.onModeChange}
                            >
                                <option value={modes.clock}>Clock</option>
                                <option value={modes.controller}>Controller</option>
                            </FormControl>
                        </FormGroup>
                        {mode === modes.controller &&
                            <FormGroup>
                                <ControlLabel>Controller</ControlLabel>
                                <FormControl
                                    componentClass="select"
                                    onChange={::this.onControllerChange}
                                    value={controller ? controller.index : undefined}
                                >
                                    <option>None</option>
                                    {_.map(midiUtil.getControllers(), data => (
                                        <option
                                            key={data.label}
                                            value={data.index}
                                        >
                                            {data.label}
                                        </option>
                                    ))}
                                </FormControl>
                            </FormGroup>
                        }
                        {mode === modes.controller &&
                            <FormGroup>
                                <ControlLabel>Tempo</ControlLabel>
                                <FormControl
                                    componentClass="select"
                                    value={this.state.tempo}
                                    onChange={::this.onTempoChange}
                                >
                                    {_.map(_.range(20, 801), i => (
                                        <option key={i} value={i}>{i}</option>
                                    ))}
                                </FormControl>
                            </FormGroup>
                        }
                    </Form>
                </div>
            </div>
        )
    }
}
