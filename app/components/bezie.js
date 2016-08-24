import React, { Component, PropTypes } from 'react'
import { Link } from 'react-router'
import styles from './bezie.css'
import _ from 'lodash'
import ReactDom from 'react-dom'
import * as utils from '../utils'
import Axis from './axis'
import Bar from './bar'
import ClickArea from './clickArea'

class Bezie extends Component {
    static propTypes = {
        snap: PropTypes.bool.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        activeIdx: PropTypes.number.isRequired,
        addPoint: PropTypes.func.isRequired,
    }

    render () {
        const margin = { top: 6, right: 6, bottom: 6, left: 6 }
        const transform = `translate(${margin.left}, ${margin.top})`

        const {
            snap,
            bars,
            zoom,
            interval,
            width,
            height,
            paths,
            activeIdx,
        } = this.props

        let line = d3.svg.line()
            .x(point => point[0])
            .y(point => point[1])

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
                    <ClickArea {...this.props} />
                    <g>
                        {paths.map((path, i) => (
                            <path
                                className="line"
                                d={line(path)}
                                key={`path-${i}`}
                            />
                        ))}
                    </g>
                    <g>
                        {utils.takeInner(paths[activeIdx]).map((point, i) => (
                            <circle
                                r={5}
                                cx={point[0]}
                                cy={point[1]}
                                key={`circle-${i}`}
                            />
                        ))}
                    </g>
                </g>
            </svg>
        )
    }
}

export default Bezie
