import React, { Component, PropTypes } from 'react'
import Automator from './automator'
import PathSelector from './pathSelector'
import { ipcRenderer } from 'electron'
import * as io from '../utils/io'

class Bezie extends Component {
    componentDidMount () {
        ipcRenderer.on('save-file', ::this.onSaveFile)
        ipcRenderer.on('open-file', ::this.onOpenFile)
    }

    render () {
        return (
            <div className="bezie">
                <div className="push-bottom-small">
                    <PathSelector {...this.props} />
                </div>
                <Automator {...this.props} />
            </div>
        )
    }

    onSaveFile (sender, filename) {
        io.save(sender, filename, this.props)
    }

    onOpenFile (filename) {}
}

export default Bezie

