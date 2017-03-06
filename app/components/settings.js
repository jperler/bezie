import React, { Component, PropTypes } from 'react'
import Immutable from 'seamless-immutable'
import _ from 'lodash'
import fs from 'fs'
import { InputGroup, Form, ButtonToolbar, Button, FormGroup, FormControl } from 'react-bootstrap'
import { colors, NUM_CC_CHANNELS } from '../constants'

const { dialog } = require('electron').remote

export default class Settings extends Component {
    static propTypes = {
        updateSettings: PropTypes.func.isRequired,
        settings: PropTypes.shape({
            midi: PropTypes.array.isRequired,
        }),
    }

    constructor (props) {
        super()

        this.state = {
            midi: props.settings.midi,
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
        this.props.updateSettings({ midi: this.state.midi })
        window.location = '#/'
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
                        <FormGroup>
                            <FormControl
                                componentClass="select"
                                placeholder="Select channel"
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
                    </Form>
                ))}
                <ButtonToolbar className="push-top">
                    <Button bsSize="small" onClick={::this.onSaveClick}>Update</Button>
                    <Button bsSize="small" onClick={() => window.location = '#/'}>Cancel</Button>
                    <Button bsSize="small" onClick={::this.onSavePresetClick}>Save Preset</Button>
                    <Button bsSize="small" onClick={::this.onLoadPresetClick}>Load Preset</Button>
                </ButtonToolbar>
            </div>
        )
    }
}
