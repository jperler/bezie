import React, { Component, PropTypes } from 'react'
import Automator from './automator'
import PathSelector from './pathSelector'
import { ipcRenderer } from 'electron'
import * as io from '../utils/io'
import { ButtonToolbar, Button } from 'react-bootstrap'

class Bezie extends Component {
    componentDidMount () {
        ipcRenderer.on('save-file', ::this.onSaveFile)
        ipcRenderer.on('open-file', ::this.onOpenFile)
    }

    render () {
        return (
            <div className="bezie">
                <div className="push-bottom">
                    <ButtonToolbar>
                        <PathSelector {...this.props} />
                        <Button bsSize="xsmall" onClick={this.props.resetPath}>Reset</Button>
                        <Button bsSize="xsmall">Reverse</Button>
                        <Button bsSize="xsmall">Inverse</Button>
                    </ButtonToolbar>
                </div>
                <Automator {...this.props} />
                <div className="push-top">
                    <div className="pull-left">
                        <ButtonToolbar>
                        </ButtonToolbar>
                    </div>
                    <div className="pull-right">
                        <ButtonToolbar>
                            <Button className="active" bsSize="xsmall">Grid</Button>
                            <Button className="active" bsSize="xsmall">Snap</Button>
                            <Button bsSize="xsmall">Triplet</Button>
                            <Button bsSize="xsmall"><i className="fa fa-minus" /></Button>
                            <Button bsSize="xsmall"><i className="fa fa-plus" /></Button>
                            <span
                                className="push-left noselect"
                                style={{ fontFamily: 'monospace', lineHeight: '22px' }}
                            >
                                1/8
                            </span>
                        </ButtonToolbar>
                    </div>
                </div>
            </div>
        )
    }

    onSaveFile (sender, filename) {
        io.save(sender, filename, this.props)
    }

    onOpenFile (filename) {}
}

export default Bezie

