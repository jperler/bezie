import React, { Component, PropTypes } from 'react'
import styles from './axis.css'

export class X extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        xAxisTickRange: PropTypes.array.isRequired,
    }

    shouldComponentUpdate (nextProps) {
        return (
            !_.isEqual(this.props.xAxisTickRange, nextProps.xAxisTickRange) ||
            !_.isEqual(this.props.height, nextProps.height)
        )
    }

    render () {
        const { xAxisTickRange, height, width } = this.props
        const length = xAxisTickRange[1]

        return (
            <g>
                <defs>
                    <pattern
                        id="xAxis"
                        width={length}
                        height={length}
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d={`M 0 0 L 0 ${length}`}
                            className={styles.path}
                        />
                    </pattern>
                </defs>
                <rect fill="url(#xAxis)" height={height} width={width + 1} />
            </g>
        )
    }
}

export class Y extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        yAxisTickRange: PropTypes.array.isRequired,
    }

    shouldComponentUpdate (nextProps) {
        return (
            !_.isEqual(this.props.yAxisTickRange, nextProps.yAxisTickRange) ||
            !_.isEqual(this.props.width, nextProps.width)
        )
    }

    render () {
        const { yAxisTickRange, height, width } = this.props
        const length = yAxisTickRange[1]

        return (
            <g>
                <defs>
                    <pattern
                        id="yAxis"
                        width={length}
                        height={length}
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d={`M 0 0 L ${length} 0`}
                            className={styles.path}
                        />
                    </pattern>
                </defs>
                <rect fill="url(#yAxis)" height={height + 1} width={width} />
            </g>
        )
    }
}
