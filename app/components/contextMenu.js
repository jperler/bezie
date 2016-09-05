import React, { Component, PropTypes } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import * as utils from '../utils'
import styles from './contextMenu.css'

class ContextMenu extends Component {
    static propTypes = {
        pathIdx: PropTypes.number.isRequired,
        selectedIdx: PropTypes.number,
        zoom: PropTypes.object.isRequired,
        height: PropTypes.number.isRequired,
        paths: PropTypes.array.isRequired,
    }

    render () {
        const { selectedIdx, pathIdx, paths, zoom, height } = this.props
        const selected = _.get(paths, [pathIdx, selectedIdx])

        if (!selected) return <span />

        const normalized = utils.normalizePoint({
            point: selected,
            height,
            zoom,
        })

        const formatted = {
            x: utils.numberFormat(normalized.x / 4),
            y: utils.numberFormat(normalized.y),
        }

        return (
            <div className={styles.menu}>
                <DropdownButton bsSize="xsmall" title="Default" id="contextMenu">
                    <MenuItem bsSize="xsmall">Default</MenuItem>
                    <MenuItem bsSize="xsmall">Bezier</MenuItem>
                </DropdownButton>
                <span className="push-left-small monospace noselect">
                    {`[${formatted.x}, ${formatted.y}]`}
                </span>
                <a href="javascript:void(0)" className="push-left">
                    <i className="fa fa-close" />
                </a>
            </div>
        )
    }
}

export default ContextMenu
