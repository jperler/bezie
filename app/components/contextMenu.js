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
        changeType: PropTypes.func.isRequired,
        removePoint: PropTypes.func.isRequired,
    }

    onTypeSelect (type) {
        this.props.changeType({ type })
    }

    onRemovePointClick () {
        this.props.removePoint({
            index: this.props.selectedIdx,
        })
    }

    render () {
        const { selectedIdx, pathIdx, paths, zoom, height } = this.props
        const selected = _.get(paths, [pathIdx, selectedIdx])
        const path = paths[pathIdx]

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

        const isEndpoint = utils.isEndpoint(path, selected)

        return (
            <div className={styles.menu}>
                <DropdownButton
                    bsSize="xsmall"
                    title={selected.isControl ? 'Bezier' : 'Default'}
                    id="contextMenu"
                    onSelect={::this.onTypeSelect}
                >
                    <MenuItem
                        bsSize="xsmall"
                        disabled={!selected.isControl || isEndpoint}
                        eventKey="default"
                    >
                        Default
                    </MenuItem>
                    <MenuItem
                        bsSize="xsmall"
                        disabled={selected.isControl || isEndpoint}
                        eventKey="bezier"
                    >
                        Bezier
                    </MenuItem>
                </DropdownButton>
                <span className="push-left-small monospace noselect">
                    {`[${formatted.x}, ${formatted.y}]`}
                </span>
                {!isEndpoint &&
                    <a
                        href="javascript:void(0)"
                        className="pull-right push-left"
                        onClick={::this.onRemovePointClick}
                    >
                        <i className="fa fa-close" />
                    </a>
                }
            </div>
        )
    }
}

export default ContextMenu
