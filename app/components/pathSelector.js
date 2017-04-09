import React, { Component, PropTypes } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { colors } from '../constants'
import midiUtils from '../utils/midi'

class PathSelector extends Component {
    static propTypes = {
        pathIdx: PropTypes.number.isRequired,
        changePath: PropTypes.func.isRequired,
        changeSelected: PropTypes.func.isRequired,
        settings: PropTypes.shape({
            midi: PropTypes.array.isRequired,
        }),
    }

    onPathSelect (i) {
        this.props.changeSelected({ index: null })
        this.props.changePath({ index: i })
    }

    render () {
        const { pathIdx, settings } = this.props

        const getIcon = i => (
            <i
                className="fa fa-stop push-right push-left"
                style={{ color: colors[i] }}
            />
        )

        const getName = i => {
            const channel = settings.midi[i].channel
            return midiUtils.getChannelName(channel)
        }

        const items = _.map(colors, (color, i) => (
            <MenuItem
                bsSize="small"
                eventKey={i}
                key={`path-select-${i}`}
            >
                <span className="push-right">
                    {getIcon(i)} {getName(i)}
                </span>
            </MenuItem>
        ))

        return (
            <DropdownButton
                bsSize="small"
                title={getIcon(pathIdx)}
                id="pathSelector"
                onSelect={::this.onPathSelect}
            >
                {items}
            </DropdownButton>
        )
    }
}

export default PathSelector
