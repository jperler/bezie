import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import styles from './bezie.css'
import _ from 'lodash'
import ReactDom from 'react-dom'
import * as utils from '../utils'
import Axis from './axis'
import Bar from './bar'

class Bezie extends Component {
    static propTypes = {
        snap: PropTypes.bool.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        activePath: PropTypes.number.isRequired,
        addPoint: PropTypes.func.isRequired,
    }

    render() {
        let margin = {
            top: 6,
            right: 6,
            bottom: 6,
            left: 6,
        }

        let line = d3.svg.line()
            .x(point => point[0])
            .y(point => point[1])

        const {
            snap,
            bars,
            zoom,
            interval,
            width,
            height,
            paths,
        } = this.props
        const transform = `translate(${margin.left}, ${margin.top})`

        return (
            <svg
                width={width + margin.left + margin.right}
                height={height + margin.top + margin.bottom}
                ref="svg"
            >
                <g transform={transform}>
                    {_.range(bars).map(i => (
                        <Bar width={width}
                            height={height}
                            bars={bars}
                            index={i}
                            key={`bar-${i}`}
                        />
                    ))}
                    <Axis.X {...this.props} />
                    <Axis.Y {...this.props} />
                    <rect height={height} width={width} ref="rect" />
                    <g>
                        {paths.map((path, i) => (
                            <path
                                className="line"
                                d={line(path)}
                                key={`path-${i}`}
                            />
                        ))}
                    </g>
                </g>
            </svg>
        )
    }

    componentDidMount () {
        const rect = d3.select(this.refs.rect)
        rect.on('mousedown', ::this.onMouseDownRect)
    }

    onMouseDownRect () {
        const { paths, activePath, addPoint } = this.props
        const [x , y] = d3.mouse(this.refs.rect)
        const path = paths[activePath]
        let index = utils.getInsertIndex(path, x)
        addPoint({ index, x, y })
    }
}

export default Bezie
