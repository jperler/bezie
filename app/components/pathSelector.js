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
                <span className="fa-stack push-right">
                    <i
                        className="fa fa-circle fa-stack-2x"
                        style={{ color: 'rgba(0,0,0,.7)' }}
                    />
                    <i
                        className="fa fa-circle push-right-small fa-stack-1x"
                        style={{ color: colors[i] }}
                    />
                </span>
                {labels[i]}
            </span>
        )

        const items = _.map(colors, (color, i) => (
            <MenuItem
                bsSize="small"
                eventKey={i}
                onClick={() => this.onChangePath(i)}
                key={`path-select-${i}`}
                style={{ fontSize: 12 }}
            >
                {getTitle({ i })}
            </MenuItem>
        ))

        return (
            <DropdownButton
                bsSize="xsmall"
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
