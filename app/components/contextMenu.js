import React, { Component, PropTypes } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { pointTypes } from '../constants'
import * as utils from '../utils'
import midi from '../utils/midi'
import styles from './contextMenu.css'
import { PITCH } from '../constants/midi'

class ContextMenu extends Component {
    static propTypes = {
        pathIdx: PropTypes.number.isRequired,
        selectedIdx: PropTypes.number,
        zoom: PropTypes.object.isRequired,
        height: PropTypes.number.isRequired,
        paths: PropTypes.array.isRequired,
        changeType: PropTypes.func.isRequired,
        removePoint: PropTypes.func.isRequired,
        settings: PropTypes.shape({
            midi: PropTypes.array.isRequired,
        }),
    }

    onTypeSelect (type) {
        this.props.changeType({ type })
    }

    onRemovePointClick () {
        this.props.removePoint({ index: this.props.selectedIdx })
    }

    render () {
        const { selectedIdx, pathIdx, paths, zoom, height, settings } = this.props
        const selected = _.get(paths, [pathIdx, selectedIdx])
        const isPitch = settings.midi[pathIdx].channel === PITCH
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

        // Update scale for pitch
        if (isPitch) formatted.y = midi.normalizePitch(normalized.y)

        const isEndpoint = utils.isEndpoint(path, selected)
        const isDefault = !_.includes(pointTypes, selected.type)
        const getPointDisplay = type => {
            switch (type) {
                case pointTypes.quadratic: return 'Bezier 1'
                case pointTypes.cubic: return 'Bezier 2'
                default: return isEndpoint ? 'Endpoint' : 'Default'
            }
        }

        return (
            <div className={styles.menu}>
                <DropdownButton
                    bsSize="xsmall"
                    title={getPointDisplay(selected.type)}
                    id="contextMenu"
                    onSelect={::this.onTypeSelect}
                    disabled={isEndpoint}
                >
                    <MenuItem
                        bsSize="xsmall"
                        disabled={isDefault || isEndpoint}
                        eventKey="default"
                    >
                        Default
                    </MenuItem>
                    <MenuItem
                        bsSize="xsmall"
                        disabled={!isDefault || isEndpoint}
                        eventKey={pointTypes.quadratic}
                    >
                        {getPointDisplay(pointTypes.quadratic)}
                    </MenuItem>
                    <MenuItem
                        bsSize="xsmall"
                        disabled={!isDefault || isEndpoint}
                        eventKey={pointTypes.cubic}
                    >
                        {getPointDisplay(pointTypes.cubic)}
                    </MenuItem>
                </DropdownButton>
                {!isEndpoint &&
                    <a
                        href="javascript:void(0)"
                        className="push-left"
                        onClick={::this.onRemovePointClick}
                    >
                        Remove
                    </a>
                }
                <span className="push-left monospace noselect">
                    {`[${formatted.x}, ${formatted.y}]`}
                </span>
            </div>
        )
    }
}

export default ContextMenu
