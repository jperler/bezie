import React, { Component, PropTypes } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { colors, labels } from '../constants'

class PathSelector extends Component {
    static propTypes = {
        pathIdx: PropTypes.number.isRequired,
        changePath: PropTypes.func.isRequired,
    }

    render () {
        const { pathIdx } = this.props

        const getTitle = ({ i }) => (
            <span>
                <i
                    className="fa fa-circle push-right"
                    style={{ color: colors[i] }}
                />
                {labels[i]}
            </span>
        )

        const items = _.map(colors, (color, i) => (
            <MenuItem
                bsSize="small"
                eventKey={i}
                onClick={() => this.onChangePath(i)}
                key={`path-select-${i}`}
            >
                {getTitle({ i })}
            </MenuItem>
        ))

        return (
            <DropdownButton
                bsSize="xsmall"
                bsStyle="primary"
                title={getTitle({ i: pathIdx })}
                id="pathSelector"
            >
                {items}
            </DropdownButton>
        )
    }

    onChangePath (i) {
        this.props.changePath({ index: i })
    }
}

export default PathSelector
