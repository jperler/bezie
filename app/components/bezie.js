import React, { Component, PropTypes } from 'react'
import _ from 'lodash'
import midi from 'midi'
import { basename } from 'path'
import { ipcRenderer } from 'electron'
import { ButtonToolbar, Button } from 'react-bootstrap'
import Automator from './automator'
import ContextMenu from './contextMenu'
import PathSelector from './pathSelector'
import LicenseForm from './licenseForm'
import * as io from '../utils/io'
import * as midiEvents from '../constants/midi'
import {
    MIN_BARS,
    MAX_BARS,
    ZOOM_FACTOR,
    CONTROL_MAX,
    PPQ,
    VIRTUAL_PORT_NAME,
    WIN_MIDI_ERROR,
    colors,
} from '../constants'

class Bezie extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        resetPath: PropTypes.func.isRequired,
        reversePath: PropTypes.func.isRequired,
        invertPath: PropTypes.func.isRequired,
        increaseBars: PropTypes.func.isRequired,
        decreaseBars: PropTypes.func.isRequired,
        zoomIn: PropTypes.func.isRequired,
        zoomOut: PropTypes.func.isRequired,
        copyPath: PropTypes.func.isRequired,
        pastePath: PropTypes.func.isRequired,
        changeSelected: PropTypes.func.isRequired,
        bars: PropTypes.number.isRequired,
        clipboard: PropTypes.object.isRequired,
        snap: PropTypes.bool.isRequired,
        toggleSnap: PropTypes.func.isRequired,
        triplet: PropTypes.bool.isRequired,
        toggleTriplet: PropTypes.func.isRequired,
        decreaseXInterval: PropTypes.func.isRequired,
        increaseXInterval: PropTypes.func.isRequired,
        interval: PropTypes.object.isRequired,
        zoom: PropTypes.object.isRequired,
        authorized: PropTypes.bool.isRequired,
        license: PropTypes.object.isRequired,
        authorize: PropTypes.func.isRequired,
        pathIdx: PropTypes.number.isRequired,
        paths: PropTypes.array.isRequired,
    }

    constructor (props) {
        super(props)
        this.state = {
            requireLicense: false,
            enabled: false,
        }
        this.initMIDI({ initial: true })
    }

    componentDidMount () {
        ipcRenderer.on('save-file', ::this.onSaveFile)
        ipcRenderer.on('open-file', ::this.onOpenFile)
        ipcRenderer.on('update-downloaded', ::this.onUpdatedDownloaded)
        ipcRenderer.on('activate', ::this.onActivate)

        this.props.authorize()
    }

    componentWillUnmount () {
        this.output.closePort()
        this.input.closePort()
    }

    onMIDIMessage (deltaTime, message) {
        const code = message[0]
        const maxTicks = this.props.bars * PPQ
        const { authorized, bars, height, width } = this.props
        const tickWidth = width / bars / PPQ

        // Reset ticks to loop automation
        if (this.tick === maxTicks) this.resetTicks()

        if (code === midiEvents.CLOCK) {
            const tickX = tickWidth * this.tick

            if (this.state.enabled) {
                // Seek manually to avoid react render
                window.seek.setAttribute('d', `M${tickX},0L${tickX},${height}`)
                window.seek.style.display = 'block'
            } else {
                window.seek.style.display = 'none'
            }

            _.each(this.props.paths, (path, pathIdx) => {
                if (path.length > 2) {
                    const value = this.getValueAtTick({ tick: this.tick, pathIdx, tickX })
                    const channel = pathIdx + 1

                    // Limit demo to send only the first bar
                    if (_.isNumber(value) && authorized || (!authorized && this.tick <= PPQ)) {
                        if (this.state.enabled) {
                            this.output.sendMessage([
                                midiEvents.CONTROL_CHANGE,
                                channel,
                                value,
                            ])
                        }
                    }
                }
            })
            this.tick++
        } else if (code === midiEvents.STOP) {
            this.resetTicks()
        }
    }

    onSaveFile (sender, filename) {
        if (this.props.authorized) {
            io.save(sender, filename, this.props)
            document.title = basename(filename)
        } else {
            this.setState({ requireLicense: true })
        }
    }

    onOpenFile (sender, filename) {
        if (this.props.authorized) {
            io.open(sender, filename, this.props)
            document.title = basename(filename)
        } else {
            this.setState({ requireLicense: true })
        }
    }

    onActivate () {
        if (this.props.authorized) {
            alert(`Activated as ${this.props.license.email}`) // eslint-disable-line
        } else {
            this.setState({ requireLicense: true })
        }
    }

    onUpdatedDownloaded (sender, version) {
        alert(`Version ${version} is downloaded and will be automatically installed on Quit`) // eslint-disable-line
    }

    onResetClick () { this.props.resetPath() }
    onReverseClick () { this.props.reversePath() }
    onInverseClick () { this.props.invertPath() }
    onCopyClick () { this.props.copyPath() }
    onPasteClick () { this.props.pastePath() }
    onIncreaseBarsClick () { this.props.increaseBars() }
    onDecreaseBarsClick () { this.props.decreaseBars() }
    onZoomInClick () { this.props.zoomIn() }
    onZoomOutClick () { this.props.zoomOut() }

    onPowerClick () {
        this.setState({ enabled: !this.state.enabled })
    }

    onBroadcastClick () {
        const { pathIdx } = this.props
        const channel = pathIdx + 1

        // Signal active MIDI channel to DAW
        this.output.sendMessage([176, channel, 0])
        this.output.sendMessage([176, channel, CONTROL_MAX])
        this.output.sendMessage([176, channel, 0])
    }

    onRetryMIDI () {
        this.initMIDI()
        this.forceUpdate()
    }

    getValueAtTick ({ pathIdx, tickX }) {
        const { paths, zoom } = this.props
        const path = paths[pathIdx]
        const lastSeenIndex = _.get(this.lastSeenIndeces, pathIdx, 0)
        const len = path.length

        let minIndex = 0
        let maxIndex = null

        // If the path has changed externally (e.g. reset) return null and reset indeces
        if (lastSeenIndex > len - 1) {
            this.lastSeenIndeces = {}
            return null
        }

        for (let i = lastSeenIndex; i < len; i++) {
            const point = path[i]
            if (point.x <= tickX) minIndex = i
            if (!maxIndex && point.x > tickX) maxIndex = i
        }

        // Cache a reference to the last seen min index to speed things up a bit
        // Every subsequent tick is guaranteed to be after the last seen min index
        this.lastSeenIndeces[pathIdx] = minIndex

        const minPoint = path[minIndex]
        const maxPoint = path[maxIndex]

        const slope = (maxPoint.y - minPoint.y) / (maxPoint.x - minPoint.x)
        const yIntercept = minPoint.y - (slope * minPoint.x)
        const tickY = slope * tickX + yIntercept

        return CONTROL_MAX - tickY / zoom.y
    }

    resetTicks () {
        this.tick = 0
        window.seek.style.display = 'none'
        this.lastSeenIndeces = {}
    }

    initMIDI ({ initial = false } = {}) {
        const isWin = /^win/.test(process.platform);

        this.output = new midi.output()
        this.input = new midi.input()
        this.noDevices = false

        if (isWin) {
            const outputPortIndex = _.find(_.range(this.output.getPortCount()), portIdx => (
                _.includes(
                    _.toLower(this.output.getPortName(portIdx)),
                    _.toLower(VIRTUAL_PORT_NAME)
                )
            ))
            const inputPortIndex = _.find(_.range(this.input.getPortCount()), portIdx => (
                _.includes(
                    _.toLower(this.input.getPortName(portIdx)),
                    _.toLower(VIRTUAL_PORT_NAME)
                )
            ))

            if (_.isNumber(inputPortIndex) && _.isNumber(outputPortIndex)) {
                this.output.openPort(outputPortIndex)
                this.input.openPort(inputPortIndex)
            } else {
                this.noDevices = true
                !initial && alert(WIN_MIDI_ERROR) // eslint-disable-line
            }
        } else {
            this.output.openVirtualPort(VIRTUAL_PORT_NAME)
            this.input.openVirtualPort(VIRTUAL_PORT_NAME)
        }

        this.input.ignoreTypes(true, false, true)
        this.input.on('message', ::this.onMIDIMessage)
        this.tick = 0
        this.lastSeenIndeces = {}
    }

    render () {
        const { authorized } = this.props
        const { requireLicense } = this.state
        const hasMIDIDevice = !this.noDevices

        return (
            <div className="bezie">
                {!authorized && requireLicense && <LicenseForm {...this.props} />}
                <div className="push-bottom">
                    <div className="pull-left">
                        <ButtonToolbar>
                            <PathSelector {...this.props} />
                            <Button title="Reset" bsSize="small" onClick={::this.onResetClick}>
                                <i className="fa fa-refresh" />
                            </Button>
                            <Button title="Reverse" bsSize="small" onClick={::this.onReverseClick}>
                                <i className="fa fa-arrows-h" />
                            </Button>
                            <Button title="Inverse" bsSize="small" onClick={::this.onInverseClick}>
                                <i className="fa fa-arrows-v" />
                            </Button>
                            <Button title="Copy" bsSize="small" onClick={::this.onCopyClick}>
                                <i className="fa fa-copy" />
                            </Button>
                            <Button
                                bsSize="small"
                                title="Paste"
                                onClick={::this.onPasteClick}
                                disabled={_.isNull(this.props.clipboard.path)}
                            >
                                <i className="fa fa-paste" />
                            </Button>
                            <Button
                                title="Broadcast MIDI"
                                bsSize="small"
                                onClick={::this.onBroadcastClick}
                                disabled={!hasMIDIDevice || this.state.enabled}
                            >
                                <i className="fa fa-bullhorn" />
                            </Button>
                            <Button
                                style={{ color: this.state.enabled ? colors[3] : '' }}
                                className={this.state.enabled ? 'active' : ''}
                                title="Enable MIDI"
                                bsSize="small"
                                onClick={::this.onPowerClick}
                                disabled={!hasMIDIDevice}
                            >
                                <i className="fa fa-power-off" />
                            </Button>
                            <ContextMenu {...this.props} />
                        </ButtonToolbar>
                    </div>
                    <div className="pull-right">
                        <ButtonToolbar>
                            <Button
                                bsSize="small"
                                onClick={::this.onZoomOutClick}
                                disabled={this.props.zoom.x - ZOOM_FACTOR <= ZOOM_FACTOR}
                            >
                                <i className="fa fa-search-minus" />
                            </Button>
                            <Button bsSize="small" onClick={::this.onZoomInClick}>
                                <i className="fa fa-search-plus" />
                            </Button>
                            <Button
                                disabled={this.props.bars === MIN_BARS}
                                bsSize="small"
                                onClick={::this.onDecreaseBarsClick}
                            >
                                <i className="fa fa-minus" />
                            </Button>
                            <Button
                                disabled={this.props.bars === MAX_BARS}
                                bsSize="small"
                                onClick={::this.onIncreaseBarsClick}
                            >
                                <i className="fa fa-plus" />
                            </Button>
                            <span
                                className="monospace noselect push-left"
                                style={{ lineHeight: '30px' }}
                            >
                                {this.props.bars}
                            </span>
                        </ButtonToolbar>
                    </div>
                    <div className="clearfix" />
                </div>
                <Automator {...this.props} />
                <div className="push-top monospace noselect">
                    <div className="pull-left" style={{ lineHeight: '30px' }}>
                        <ButtonToolbar>
                            <span className="pull-left push-left push-right text-muted">
                                MIDI: {hasMIDIDevice ? 'Connected' : 'Not connected'}
                            </span>
                            {!hasMIDIDevice &&
                                <Button onClick={::this.onRetryMIDI} bsSize="small">Retry</Button>
                            }
                        </ButtonToolbar>
                    </div>
                    <div className="pull-right">
                        <ButtonToolbar>
                            <Button
                                onClick={this.props.toggleSnap}
                                className={this.props.snap ? 'active' : ''}
                                bsSize="small"
                            >
                                Snap
                            </Button>
                            <Button
                                onClick={this.props.toggleTriplet}
                                className={this.props.triplet ? 'active' : ''}
                                bsSize="small"
                            >
                                Triplet
                            </Button>
                            <Button
                                disabled={
                                    this.props.triplet ?
                                        this.props.interval.x === 1.5 :
                                        this.props.interval.x === 1
                                }
                                bsSize="small"
                                onClick={this.props.decreaseXInterval}
                            >
                                <i className="fa fa-minus" />
                            </Button>
                            <Button
                                disabled={
                                    this.props.triplet ?
                                        this.props.interval.x === 192 :
                                        this.props.interval.x === 128
                                }
                                bsSize="small"
                                onClick={this.props.increaseXInterval}
                            >
                                <i className="fa fa-plus" />
                            </Button>
                            <span
                                className="pull-left monospace push-left noselect"
                                style={{ lineHeight: '30px' }}
                            >
                                1/{
                                    this.props.triplet ?
                                        this.props.interval.x / 1.5 :
                                        this.props.interval.x}{this.props.triplet && 'T'
                                }
                            </span>
                        </ButtonToolbar>
                    </div>
                </div>
            </div>
        )
    }

}

export default Bezie
