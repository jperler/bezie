import React, { Component, PropTypes } from 'react'
import { ipcRenderer } from 'electron'
import { ButtonToolbar, Button } from 'react-bootstrap'
import Automator from './automator'
import PathSelector from './pathSelector'
import * as io from '../utils/io'

class Bezie extends Component {
    static propTypes = {
        resetPath: PropTypes.func.isRequired,
    }

    componentDidMount () {
        ipcRenderer.on('save-file', ::this.onSaveFile)
        ipcRenderer.on('open-file', ::this.onOpenFile)
    }

    onSaveFile (sender, filename) {
        io.save(sender, filename, this.props)
    }

    onOpenFile (filename) {} // eslint-disable-line no-unused-vars

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
                        <ButtonToolbar />
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

}

export default Bezie
