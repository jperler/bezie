import React, { Component, PropTypes } from 'react'
import Immutable from 'seamless-immutable'
import _ from 'lodash'
import fs from 'fs'
import {
    ControlLabel,
    InputGroup,
    Form,
    ButtonToolbar,
    Button,
    FormGroup,
    FormControl,
} from 'react-bootstrap'
import { colors, NUM_CC_CHANNELS } from '../constants'
import { default as midiUtil } from '../utils/midi'

const { dialog } = require('electron').remote

export default class Settings extends Component {
    static propTypes = {
        updateSettings: PropTypes.func.isRequired,
        settings: PropTypes.shape({
            midi: PropTypes.array.isRequired,
            tempo: PropTypes.number.isRequired,
        }),
    }

    constructor (props) {
        super()

        this.state = {
            midi: props.settings.midi,
            tempo: props.settings.tempo,
            mappings: Immutable({}),
        }
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
        })
        window.location = '#/'
    }

    onTempoChange (e) {
        this.setState({ tempo: parseInt(e.target.value, 10) })
    }

    onMIDILearnClick (pathIdx) {
        const { mappings } = this.state
        const listener = (deltaTime, message) => {
            const code = [message[0], message[1]].join('.')
            this.setState({ mappings: mappings.set(pathIdx, code) })
            midiUtil.controller.removeListener('message', listener)
        }

        midiUtil.controller.on('message', listener)
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

    render () {
        const { midi } = this.state
        const currentChannels = _.map(midi, 'channel')

        return (
            <div>
                <div className="pull-left">
                    {this.props.settings.midi.map((config, pathIdx) => (
                        <Form inline key={pathIdx}>
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
                            <FormGroup className="push-left-small">
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
                            <FormGroup className="push-left-small">
                                <InputGroup>
                                    <InputGroup.Addon>
                                        <Button
                                            bsSize="xsmall"
                                            onClick={() => this.onMIDILearnClick(pathIdx)}
                                        >
                                            Learn
                                        </Button>
                                    </InputGroup.Addon>
                                    <FormControl
                                        type="text"
                                        disabled
                                        value={this.state.mappings[pathIdx]}
                                        onChange={_.noop}
                                    />
                                    <InputGroup.Addon>
                                        <Button bsSize="xsmall" disabled>
                                            <i className="fa fa-close" />
                                        </Button>
                                    </InputGroup.Addon>
                                </InputGroup>
                            </FormGroup>
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
                            <ControlLabel>Controller</ControlLabel>
                            <FormControl
                                componentClass="select"
                                onChange={i => midiUtil.setController(i)}
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
                        <FormGroup>
                            <ControlLabel>Tempo</ControlLabel>
                            <FormControl
                                componentClass="select"
                                onChange={() => {}}
                                value={this.state.tempo}
                                onChange={::this.onTempoChange}
                            >
                                {_.map(_.range(20, 801), i => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </FormControl>
                        </FormGroup>
                    </Form>
                </div>
            </div>
        )
    }
}
