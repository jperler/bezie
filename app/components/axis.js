import React, { Component, PropTypes } from 'react'
import * as utils from '../utils'
import ReactDom from 'react-dom'

export class X extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        interval: PropTypes.object.isRequired,
        bars: PropTypes.number.isRequired,
        xAxisTickRange: PropTypes.array.isRequired,
    }

    componentDidMount () { this.updateAxis() }
    componentDidUpdate () { this.updateAxis() }

    updateAxis () {
        let {
            height,
            width,
            interval,
            bars,
            xAxisTickRange,
         } = this.props

        let scale = d3.scale.linear()
            .domain([0, width])
            .range([0, width])

        let xAxis = d3.svg.axis()
            .scale(scale)
            .orient('bottom')
            .innerTickSize(-height)
            .outerTickSize(0)
            .tickValues(xAxisTickRange)
            .tickFormat(() => '')

        d3.select(this.refs.axis).call(xAxis)
    }

    render () {
        let { height } = this.props

        return (
            <g
                className="x axis"
                stroke="#FFF"
                strokeOpacity=".1"
                transform={`translate(0, ${height})`}
                ref="axis"
            />
        )
    }
}

export class Y extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        interval: PropTypes.object.isRequired,
        yAxisTickRange: PropTypes.array.isRequired,
    }

    componentDidMount () { this.updateAxis() }
    componentDidUpdate () { this.updateAxis() }

    updateAxis () {
        let {
            height,
            width,
            interval,
            yAxisTickRange,
         } = this.props

        let scale = d3.scale.linear()
            .domain([0, height])
            .range([height, 0])

        let axis = d3.svg.axis()
            .scale(scale)
            .orient('left')
            .innerTickSize(-width)
            .outerTickSize(0)
            .tickValues(yAxisTickRange)
            .tickFormat(() => '')

        d3.select(this.refs.axis).call(axis)
    }

    render () {
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
