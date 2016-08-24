import React, { Component, PropTypes } from 'react'
import * as utils from '../utils'

class ClickArea extends Component {
    componentDidMount () {
        const rect = d3.select(this.refs.rect)
        rect.on('mousedown', ::this.onMouseDownRect)
    }

    render () {
        const { height, width } = this.props
        return <rect height={height} width={width} ref="rect" />
    }

    onMouseDownRect () {
        const { paths, activeIdx, addPoint } = this.props
        const [x , y] = d3.mouse(this.refs.rect)
        const path = paths[activeIdx]
        let index = utils.getInsertIndex(path, x)
        addPoint({ index, x, y })
    }
}

export default ClickArea
