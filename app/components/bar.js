import React, { Component, PropTypes } from 'react'

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
        const fill = index % 2 === 0 ? '#333' : '#666'

        return (
            <rect
                width={barWidth}
                height={height}
                transform={transform}
                fill={fill}
            />
        )
    }
}

export default Bar
