import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'
import styles from './bar.css'

class Bar extends Component {
    render () {
        const {
            width,
            height,
            bars,
            index,
        } = this.props
        const barWidth = width / bars
        const transform = `translate(${barWidth * index}, 0)`
        const classes = classNames(styles.bar, {
            [styles.even]: index % 2 === 0,
        })

        return (
            <rect
                className={classes}
                width={barWidth}
                height={height}
                transform={transform}
            />
        )
    }
}

export default Bar
