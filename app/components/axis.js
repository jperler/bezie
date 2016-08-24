import React, { Component, PropTypes } from 'react'
import * as utils from '../utils'
import ReactDom from 'react-dom'

class XAxis extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        interval: PropTypes.object.isRequired,
        bars: PropTypes.number.isRequired,
    }

    componentDidMount () { this.updateAxis() }
    componentDidUpdate () { this.updateAxis() }

    updateAxis () {
        let {
            height,
            width,
            interval,
            bars,
         } = this.props

        let skip = width / (interval.x * bars)
        let tickRange = utils.rangeInclusive(0, width, skip)
        let scale = d3.scale.linear()
            .domain([0, width])
            .range([0, width])

        let xAxis = d3.svg.axis()
            .scale(scale)
            .orient('bottom')
            .innerTickSize(-height)
            .outerTickSize(0)
            .tickValues(tickRange)

        d3.select(this.refs.axis).call(xAxis)
    }

    render () {
        let {
            height,
        } = this.props

        return (
            <g
                className="x axis"
                stroke="#FFF"
                strokeOpacity=".1"
                transform={'translate(0,' + height + ')'}
                ref="axis"
            />
        )
    }
}

class YAxis extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        interval: PropTypes.object.isRequired,
    }

    componentDidMount () { this.updateAxis() }
    componentDidUpdate () { this.updateAxis() }

    updateAxis () {
        let {
            height,
            width,
            interval,
         } = this.props

        let skip = height / interval.y
        let tickRange = utils.rangeInclusive(0, height, skip)
        let scale = d3.scale.linear()
            .domain([0, height])
            .range([height, 0])

        let axis = d3.svg.axis()
            .scale(scale)
            .orient('left')
            .innerTickSize(-width)
            .outerTickSize(0)
            .tickValues(tickRange)

        d3.select(this.refs.axis).call(axis)
    }

    render () {
        let { height } = this.props

        return (
            <g
                className="y axis"
                stroke="#FFF"
                strokeOpacity=".1"
                ref="axis"
            />
        )
    }
}

export default {
    X: XAxis,
    Y: YAxis,
}
