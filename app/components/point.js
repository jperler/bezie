import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'
import _ from 'lodash'

class Point extends Component {
    static propTypes = {
        onMouseDown: React.PropTypes.func.isRequired,
        onDoubleClick: React.PropTypes.func.isRequired,
        x: React.PropTypes.number,
        y: React.PropTypes.number,
        selected: React.PropTypes.bool,
        dragging: React.PropTypes.bool,
        color: React.PropTypes.string.isRequired,
    }

    shouldComponentUpdate (nextProps) {
        return (
            nextProps.x !== this.props.x ||
            nextProps.y !== this.props.y ||
            nextProps.selected !== this.props.selected ||
            nextProps.dragging !== this.props.dragging
        )
    }

    render () {
        const {
            onMouseDown,
            onDoubleClick,
            selected,
            dragging,
            x,
            y,
            color,
        } = this.props
        const classes = classNames({ selected })

        return (
            <circle
                className={classNames('point', { selected })}
                onMouseDown={onMouseDown}
                onDoubleClick={onDoubleClick}
                r={5}
                cx={x}
                cy={y}
                stroke={color}
            />
        )
    }
}

export default Point
