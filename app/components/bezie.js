import React, { Component, PropTypes } from 'react'
import _ from 'lodash'
import { mouseTrap } from 'react-mousetrap'
import { basename } from 'path'
import { ipcRenderer } from 'electron'
import { ButtonToolbar, Button } from 'react-bootstrap'
import Automator from './automator'
import ContextMenu from './contextMenu'
import PathSelector from './pathSelector'
import LicenseForm from './licenseForm'
import * as io from '../utils/io'
import * as midiEvents from '../constants/midi'
import midi from '../utils/midi'
import * as utils from '../utils'
import {
    MIN_BARS,
    MAX_BARS,
    ZOOM_FACTOR,
    CONTROL_MAX,
    PPQ,
    NUM_PATHS,
    colors,
    pointTypes,
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
        changePath: PropTypes.func.isRequired,
        bindShortcut: PropTypes.func.isRequired,
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
        selectedIdx: PropTypes.number,
        changeType: PropTypes.func.isRequired,
        paths: PropTypes.array.isRequired,
        settings: PropTypes.shape({
            midi: PropTypes.array.isRequired,
        }),
    }

    constructor (props) {
        super(props)
        this.state = {
            requireLicense: false,
            enabled: false,
            trigger: false,
        }
        this.pathIntervals = {}
        this.initMIDI()
    }

    componentWillMount () {
        // Bind keyboard shortcuts
        _.each(_.range(NUM_PATHS), i => {
            this.props.bindShortcut(`${i + 1}`, () => {
                this.props.changeSelected({ index: null })
                this.props.changePath({ index: i })
            })
        })

        _.each(_.range(NUM_PATHS), i => {
            this.props.bindShortcut(`shift+${i + 1}`, () => {
                this.sendPath({ index: i })
            })
        })

        this.props.bindShortcut('mod+c', ::this.onCopyClick)
        this.props.bindShortcut('mod+v', ::this.onPasteClick)
        this.props.bindShortcut('mod+1', ::this.onDecreaseXIntervalClick)
        this.props.bindShortcut('mod+2', ::this.onIncreaseXIntervalClick)
        this.props.bindShortcut('mod+-', ::this.onZoomOutClick)
        this.props.bindShortcut('mod+=', ::this.onZoomInClick)
        this.props.bindShortcut('mod+,', ::this.onSettingsClick)
        this.props.bindShortcut('p', ::this.onPowerClick)
        this.props.bindShortcut('v', ::this.onInverseClick)
        this.props.bindShortcut('h', ::this.onReverseClick)
        this.props.bindShortcut('b', ::this.onBroadcastClick)
        this.props.bindShortcut('t', this.props.toggleTriplet)
        this.props.bindShortcut('s', this.props.toggleSnap)
        this.props.bindShortcut('up', _.partial(::this.onTypeChange, true))
        this.props.bindShortcut('down', _.partial(::this.onTypeChange, false))

        midi.input.on('message', ::this.onMIDIMessage)
    }

    componentDidMount () {
        ipcRenderer.on('save-file', ::this.onSaveFile)
        ipcRenderer.on('open-file', ::this.onOpenFile)
        ipcRenderer.on('update-downloaded', ::this.onUpdatedDownloaded)
        ipcRenderer.on('activate', ::this.onActivate)

        this.props.authorize()
    }

    componentWillUnmount () {
        ipcRenderer.removeListener('save-file', ::this.onSaveFile)
        ipcRenderer.removeListener('open-file', ::this.onOpenFile)
        ipcRenderer.removeListener('update-downloaded', ::this.onUpdatedDownloaded)
        ipcRenderer.removeListener('activate', ::this.onActivate)
        midi.input.removeAllListeners('message')
    }

    onTypeChange (isUp) {
        const { paths, pathIdx, selectedIdx } = this.props

        if (!selectedIdx) return

        const path = paths[pathIdx]
        const point = paths[pathIdx][selectedIdx]
        const allTypes = _.concat(['default'], _.values(pointTypes))
        const type = point.type || 'default'
        const index = _.indexOf(allTypes, type)
        const cycleLeftIndex = index === 0 ? allTypes.length - 1 : index - 1
        const cycleRightIndex = index < allTypes.length - 1 ? index + 1 : 0
        const nextIndex = isUp ? cycleLeftIndex : cycleRightIndex
        const nextType = allTypes[nextIndex]

        if (utils.isEndpoint(path, point)) return

        if (type !== 'default') this.props.changeType({ type: 'default' })
        if (nextType !== 'default') this.props.changeType({ type: nextType })
    }

    onMIDIMessage (deltaTime, message) {
        if (this.state.trigger) return undefined

        const code = message[0]
        const maxTicks = this.props.bars * PPQ
        const { authorized, bars, height, width, settings } = this.props
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
                    const channel = settings.midi[pathIdx].channel

                    // Limit demo to send only the first bar
                    if (_.isNumber(value) && authorized || (!authorized && this.tick <= PPQ)) {
                        if (this.state.enabled) {
                            midi.output.sendMessage([
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
    onIncreaseBarsClick () { this.props.increaseBars() }
    onDecreaseBarsClick () { this.props.decreaseBars() }
    onZoomInClick () { this.props.zoomIn() }
    onZoomOutClick () { this.props.zoomOut() }

    onPasteClick () {
        if (!_.isNull(this.props.clipboard.path)) this.props.pastePath()
    }

    onPowerClick () {
        this.setState({ enabled: !this.state.enabled })
    }

    onSettingsClick () {
        if (!this.state.enabled) window.location = '#/settings'
    }

    onIncreaseXIntervalClick () {
        const disabled = this.props.triplet ?
            this.props.interval.x === 192 :
            this.props.interval.x === 128

        if (!disabled) this.props.increaseXInterval()
    }

    onDecreaseXIntervalClick () {
        const disabled = this.props.triplet ?
            this.props.interval.x === 1.5 :
            this.props.interval.x === 1

        if (!disabled) this.props.decreaseXInterval()
    }

    onBroadcastClick () {
        const { pathIdx, settings } = this.props
        const channel = settings.midi[pathIdx].channel

        if (this.state.enabled) return

        // Signal active MIDI channel to DAW
        midi.output.sendMessage([176, channel, 0])
        midi.output.sendMessage([176, channel, CONTROL_MAX])
        midi.output.sendMessage([176, channel, 0])
    }

    onTriggerClick () {
        this.resetTicks()
        this.setState({ trigger: !this.state.trigger })
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

    sendPath ({ index }) {
        const { bars, width, settings } = this.props
        const delta = 60e3 / (settings.tempo * 24)
        const maxTicks = this.props.bars * PPQ
        const tickWidth = width / bars / PPQ
        let tick = 0

        if (!this.state.trigger) return undefined

        clearInterval(this.pathIntervals[index])

        this.pathIntervals[index] = setInterval(() => {
            if (tick < maxTicks) {
                const tickX = tickWidth * tick
                const value = this.getValueAtTick({ tick, pathIdx: index, tickX })
                const channel = settings.midi[index].channel

                if (this.state.enabled) {
                    midi.output.sendMessage([
                        midiEvents.CONTROL_CHANGE,
                        channel,
                        value,
                    ])
                }
                tick++
            } else {
                clearInterval(this.pathIntervals[index])
                delete this.pathIntervals[index]
                tick = 0
            }
        }, delta)
    }

    resetTicks () {
        this.tick = 0
        window.seek.style.display = 'none'
        this.lastSeenIndeces = {}
    }

    initMIDI () {
        if (!midi.isConnected()) midi.connectVirtualPorts()
        this.tick = 0
        this.lastSeenIndeces = {}
    }

    render () {
        const { authorized, settings, pathIdx } = this.props
        const { requireLicense } = this.state
        const isConnected = midi.isConnected()

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
                                disabled={!isConnected || this.state.enabled}
                            >
                                <i className="fa fa-bullhorn" />
                            </Button>
                            <Button
                                bsSize="small"
                                className={this.state.trigger ? 'active' : undefined}
                                onClick={::this.onTriggerClick}
                            >
                                <i className="fa fa-keyboard-o" />
                            </Button>
                            <Button
                                className={this.state.enabled ? 'active' : ''}
                                title="Settings"
                                bsSize="small"
                                disabled={this.state.enabled}
                                onClick={::this.onSettingsClick}
                            >
                                <i className="fa fa-cog" />
                            </Button>
                            <Button
                                style={{ color: this.state.enabled ? colors[3] : '' }}
                                className={this.state.enabled ? 'active' : ''}
                                title="Enable MIDI"
                                bsSize="small"
                                onClick={::this.onPowerClick}
                                disabled={!isConnected}
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
                                MIDI: {isConnected ? 'Connected' : 'Not connected'}
                            </span>
                            {!isConnected &&
                                <Button onClick={::this.onRetryMIDI} bsSize="small">Retry</Button>
                            }
                            {!authorized &&
                                <Button
                                    bsStyle="primary"
                                    bsSize="small"
                                    className="push-left"
                                    onClick={::this.onActivate}
                                >
                                    Activate
                                </Button>
                            }
                            <span
                                className="pull-left monospace push-left noselect"
                                style={{ lineHeight: '30px' }}
                            >
                                {
                                    settings.midi[pathIdx].name ||
                                    `Channel ${settings.midi[pathIdx].channel}`
                                }
                            </span>
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

export default mouseTrap(Bezie)
