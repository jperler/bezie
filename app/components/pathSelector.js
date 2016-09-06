import React, { Component, PropTypes } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { colors, labels } from '../constants'

class PathSelector extends Component {
    static propTypes = {
        pathIdx: PropTypes.number.isRequired,
        changePath: PropTypes.func.isRequired,
        changeSelected: PropTypes.func.isRequired,
    }

    onPathSelect (i) {
        this.props.changeSelected({ index: null })
        this.props.changePath({ index: i })
    }

    render () {
        const { pathIdx } = this.props

        const getTitle = ({ i }) => (
            <span className="push-right-small">
                <i
                    className="fa fa-stop push-right push-left-small"
                    style={{ color: colors[i] }}
                />
                {labels[i]}
            </span>
        )

        const items = _.map(colors, (color, i) => (
            <MenuItem
                bsSize="small"
                eventKey={i}
                key={`path-select-${i}`}
            >
                {getTitle({ i })}
            </MenuItem>
        ))

        return (
            <DropdownButton
                bsSize="small"
                title={getTitle({ i: pathIdx })}
                id="pathSelector"
                onSelect={::this.onPathSelect}
            >
                {items}
            </DropdownButton>
        )
    }
}

export default PathSelector
