import React, { Component, PropTypes } from 'react'
import { ipcRenderer } from 'electron'
import { ButtonToolbar, Button } from 'react-bootstrap'
import Automator from './automator'
import ContextMenu from './contextMenu'
import PathSelector from './pathSelector'
import * as io from '../utils/io'

class Bezie extends Component {
    static propTypes = {
        resetPath: PropTypes.func.isRequired,
        changeSelected: PropTypes.func.isRequired,
    }

    componentDidMount () {
        ipcRenderer.on('save-file', ::this.onSaveFile)
        ipcRenderer.on('open-file', ::this.onOpenFile)
    }

    onSaveFile (sender, filename) {
        io.save(sender, filename, this.props)
    }

    onOpenFile (filename) {} // eslint-disable-line no-unused-vars

    onResetClick () {
        this.props.changeSelected({ index: null })
        this.props.resetPath()
    }

    render () {
        return (
            <div className="bezie">
                <div className="push-bottom">
                    <ButtonToolbar>
                        <PathSelector {...this.props} />
                        <Button bsSize="small" onClick={::this.onResetClick}>Reset</Button>
                        <Button bsSize="small">Reverse</Button>
                        <Button bsSize="small">Inverse</Button>
                        <ContextMenu {...this.props} />
                    </ButtonToolbar>
                </div>
                <Automator {...this.props} />
                <div className="push-top">
                    <div className="pull-left">
                        <ButtonToolbar />
                    </div>
                    <div className="pull-right">
                        <ButtonToolbar>
                            <Button onClick={this.props.toggleSnap} className={this.props.snap ? 'active' : ''} bsSize="small">Snap</Button>
                            <Button onClick={this.props.toggleTriplet} className={this.props.triplet ? 'active' : ''} bsSize="small">Triplet</Button>
                            <Button
                                disabled={this.props.triplet ? this.props.interval.x === 1.5 : this.props.interval.x === 1}
                                bsSize="small"
                                onClick={this.props.decreaseXInterval}
                            >
                                <i className="fa fa-minus" />
                            </Button>
                            <Button
                                disabled={this.props.triplet ? this.props.interval.x === 192 : this.props.interval.x === 128}
                                bsSize="small"
                                onClick={this.props.increaseXInterval}
                            >
                                <i className="fa fa-plus" />
                            </Button>
                            <span
                                className="pull-left monospace push-left noselect"
                                style={{
                                    fontFamily: 'monospace',
                                    lineHeight: '30px',
                                }}
                            >
                                1/{this.props.triplet ? this.props.interval.x / 1.5 : this.props.interval.x}{this.props.triplet && 'T'}
                            </span>
                        </ButtonToolbar>
                    </div>
                </div>
            </div>
        )
    }

}

export default Bezie
