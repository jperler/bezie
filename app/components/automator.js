import React, { Component, PropTypes } from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import { mouseTrap } from 'react-mousetrap'
import styles from './automator.css'
import * as utils from '../utils'
import * as Axis from './axis'
import Bars from './bars'
import Point from './point'
import Seek from './seek'
import { colors, pointTypes } from '../constants'

class Automator extends Component {
    static propTypes = {
        snap: PropTypes.bool.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        bars: PropTypes.number.isRequired,
        pathIdx: PropTypes.number.isRequired,
        selectedIdx: PropTypes.number,
        addPoint: PropTypes.func.isRequired,
        removePoint: PropTypes.func.isRequired,
        updatePoint: PropTypes.func.isRequired,
        changePath: PropTypes.func.isRequired,
        changeSelected: PropTypes.func.isRequired,
        paths: PropTypes.array.isRequired,
        xAxisTickRange: PropTypes.array.isRequired,
        yAxisTickRange: PropTypes.array.isRequired,
        bindShortcut: PropTypes.func.isRequired,
    }

    constructor () {
        super()
        this.state = {
            draggedIdx: null,
        }
    }

    componentWillMount () {
        this.props.bindShortcut('backspace', () => {
            const index = this.props.selectedIdx
            if (_.isNull(index)) return
            this.setState({ draggedIdx: null })
            this.props.removePoint({ index })
        })
    }

    componentDidMount () {
        d3.select(window)
            .on('mousemove', _.throttle(::this.onMouseMove, 30, { trailing: false }))
            .on('mouseup', ::this.onMouseUp)

        d3.select(this.rect).on('mousedown', ::this.onMouseDownRect)
    }

    componentWillUnmount () {
        // Ensure events are removed when switching components
        d3.select(window).on('mousemove', null).on('mouseup', null)
        d3.select(this.rect).on('mousedown', null)
    }

    onMouseDownPoint (i) {
        this.setState({ draggedIdx: i })
        this.props.changeSelected({ index: i })
    }

    onDoubleClickPoint (i) {
        this.setState({ draggedIdx: null })
        this.props.removePoint({ index: i })
    }

    onMouseUp () {
        this.setState({ draggedIdx: null })
    }

    onMouseMove () {
        if (!this.state.draggedIdx) return undefined
        const [x, y] = d3.mouse(this.rect)
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
        const gridPoint = snap ?
            utils.getGridPoint(mousePoint, xAxisTickRange, yAxisTickRange) :
            mousePoint

        let left = _.includes(pointTypes, draggedPoint.type) ?
            utils.getPoint(path, draggedPoint.left) :
            path[draggedIdx - 1]
        let right = _.includes(pointTypes, draggedPoint.type) ?
            utils.getPoint(path, draggedPoint.right) :
            path[draggedIdx + 1]

        const controlLeft = _.find(path, p => p.isControl && p.left === draggedPoint.id)
        const controlRight = _.find(path, p => p.isControl && p.right === draggedPoint.id)
        if (controlRight) left = controlRight
        if (controlLeft) right = controlLeft

        const minX = draggedIdx === 0 ? 0 : Math.max(0, left.x)
        const maxX = draggedIdx < path.length - 1 ?
            Math.min(width, gridPoint.x, right.x) :
            Math.min(width, gridPoint.x)

        const nextX = Math.max(minX, maxX)
        const nextY = Math.max(0, Math.min(height, gridPoint.y))

        // Only call update action when the point's coordinates have changed
        if (!_.isEqual(draggedPoint.x, nextX) || !_.isEqual(draggedPoint.y, nextY)) {
            updatePoint({
                index: draggedIdx,
                x: nextX,
                y: nextY,
                controlLeft,
                controlRight,
                left,
                right,
            })
        }
    }

    onMouseDownRect () {
        const { paths, pathIdx, addPoint } = this.props
        const [x, y] = d3.mouse(this.rect)
        const path = paths[pathIdx]
        const index = utils.getInsertIndex(path, x)
        const inBounds = _.find(path, p => (
            _.includes(pointTypes, p.type) &&
            utils.inRangeInclusive(
                x,
                utils.getPoint(path, p.left).x,
                utils.getPoint(path, p.right).x,
            )
        ))

        if (inBounds) return undefined

        this.setState({ draggedIdx: index })
        addPoint({ index, x, y })
    }

    render () {
        const margin = { top: 6, right: 6, bottom: 6, left: 6 }
        const { bars, width, height, paths, pathIdx, selectedIdx } = this.props
        const { draggedIdx } = this.state
        const innerPath = utils.takeInner(paths[pathIdx])
        const classes = classNames(styles.automator, {
            [styles.dragging]: !!draggedIdx
        })

        const line = d3.svg.line()
            .x(point => point.x)
            .y(point => point.y)

        const elements = {}

        // Don't filter out points so all the indexes are aligned
        elements.points = _.compact(innerPath.map((point, i) => {
            if (!point.hidden) {
                return (
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
                )
            }
        }))

        elements.paths = paths.map((path, i) => {
            if (i === pathIdx) return undefined
            return (
                <path
                    className="line"
                    d={line(path)}
                    key={`path-${i}`}
                    stroke={colors[i]}
                    strokeOpacity={0.3}
                    fill={'none'}
                />
            )
        }).concat([
            <path
                className="line"
                d={line(paths[pathIdx])}
                key={`path-${pathIdx}`}
                stroke={colors[pathIdx]}
                strokeOpacity={1}
                fill={colors[pathIdx]}
            />
        ])

        return (
            <div className={classes}>
                <svg

                    width={width + margin.left + margin.right}
                    height={height + margin.top + margin.bottom}
                >
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                        <Bars width={width} height={height} bars={bars} />
                        <Axis.X {...this.props} />
                        <Axis.Y {...this.props} />
                        <rect height={height} width={width} ref={ref => this.rect = ref} />
                        {elements.paths}
                        {elements.points}
                        <Seek height={height} />
                    </g>
                </svg>
            </div>
        )
    }
}

export default mouseTrap(Automator)
