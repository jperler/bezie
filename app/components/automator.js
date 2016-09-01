import React, { Component, PropTypes } from 'react'
import styles from './automator.css'
import _ from 'lodash'
import * as utils from '../utils'
import * as Axis from './axis'
import Bar from './bar'
import Point from './point'
import classNames from 'classnames'
import { colors } from '../constants'

class Automator extends Component {
    static propTypes = {
        snap: PropTypes.bool.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        pathIdx: PropTypes.number.isRequired,
        addPoint: PropTypes.func.isRequired,
        removePoint: PropTypes.func.isRequired,
        updatePoint: PropTypes.func.isRequired,
        changePath: PropTypes.func.isRequired,
        paths: PropTypes.array.isRequired,
    }

    constructor () {
        super()
        this.state = {
            draggedIdx: null,
            selectedIdx: null,
        }
    }

    componentDidMount () {
        d3.select(window)
            .on('mousemove', _.throttle(::this.onMouseMove, 30, { trailing: false }))
            .on('mouseup', ::this.onMouseUp)

        d3.select(this.refs.rect)
            .on('mousedown', ::this.onMouseDownRect)
    }

    render () {
        const margin = { top: 6, right: 6, bottom: 6, left: 6 }
        const { bars, width, height, paths, pathIdx, interval } = this.props
        const { draggedIdx, selectedIdx } = this.state
        const innerPath = utils.takeInner(paths[pathIdx])
        const classes = classNames(styles.automator, {
            [styles.dragging]: !!draggedIdx
        })

        let line = d3.svg.line()
            .x(point => point.x)
            .y(point => point.y)

        let elements = {}

        elements.points = innerPath.map((point, i) => (
            <Point
                onMouseDown={() => this.onMouseDownPoint(i + 1)}
                onDoubleClick={() => this.onDoubleClickPoint(i + 1)}
                selected={i + 1 === selectedIdx}
                dragging={i + 1 === draggedIdx}
                x={point.x}
                y={point.y}
                key={`point-${i}`}
                color={colors[pathIdx]}
            />
        ))

        elements.paths = paths.map((path, i) => (
            <path
                className="line"
                d={line(path)}
                key={`path-${i}`}
                stroke={colors[i]}
                strokeOpacity={i === pathIdx ? 1 : .2}
                fill={i === pathIdx ? colors[i] : 'none'}
            />
        ))

        elements.bars = _.range(bars).map(i => (
            <Bar
                width={width}
                height={height}
                bars={bars}
                index={i}
                key={`bar-${i}`}
            />
        ))

        return (
            <div className={classes}>
                <svg

                    width={width + margin.left + margin.right}
                    height={height + margin.top + margin.bottom}
                    ref="svg"
                >
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        {elements.bars}
                        <Axis.X {...this.props} />
                        <Axis.Y {...this.props} />
                        <rect height={height} width={width} ref="rect" />
                        {elements.paths}
                        {elements.points}
                    </g>
                </svg>
            </div>
        )
    }

    onMouseDownPoint (i) {
        this.setState({ draggedIdx: i, selectedIdx: i })
    }

    onDoubleClickPoint (i) {
        this.setState({ draggedIdx: null, selectedIdx: null })
        this.props.removePoint({ index: i })
    }

    onMouseUp () {
        this.setState({ draggedIdx: null })
    }

    onMouseMove () {
        if (!this.state.draggedIdx) return undefined
        let [x , y] = d3.mouse(this.refs.rect)
        const {
            updatePoint,
            width,
            height,
            snap,
            paths,
            pathIdx,
            xAxisTickRange,
            yAxisTickRange,
        } = this.props
        const { draggedIdx } = this.state
        const path = paths[pathIdx]
        const draggedPoint = path[draggedIdx]
        const mousePoint = { x, y }
        let gridPoint = snap ?
            utils.getGridPoint(mousePoint, xAxisTickRange, yAxisTickRange) :
            mousePoint
        const left = path[draggedIdx - 1]
        const right = path[draggedIdx + 1]

        let minX = draggedIdx == 0 ? 0 : Math.max(0, left.x)
        let maxX = draggedIdx < path.length - 1 ?
            Math.min(width, gridPoint.x, right.x) :
            Math.min(width, gridPoint.x)

        x = Math.max(minX, maxX)
        y = Math.max(0, Math.min(height, gridPoint.y))

        // Only call update action when the point's coordinates have changed
        if (!_.isEqual(draggedPoint.x, x) || !_.isEqual(draggedPoint.y, y)) {
            updatePoint({ index: draggedIdx, x, y })
        }
    }

    onMouseDownRect () {
        const { paths, pathIdx, addPoint } = this.props
        const [x , y] = d3.mouse(this.refs.rect)
        const path = paths[pathIdx]
        const index = utils.getInsertIndex(path, x)

        addPoint({ index, x, y })

        this.setState({
            draggedIdx: index,
            selectedIdx: index,
        })
    }
}

export default Automator
