import React, { Component, PropTypes } from 'react'

export class X extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        interval: PropTypes.object.isRequired,
        zoom: PropTypes.object.isRequired,
        bars: PropTypes.number.isRequired,
        xAxisTickRange: PropTypes.array.isRequired,
    }

    componentDidMount () { this.updateAxis() }

    shouldComponentUpdate (nextProps) {
        return (
            nextProps.width !== this.props.width ||
            nextProps.height !== this.props.height ||
            nextProps.interval !== this.props.interval ||
            nextProps.bars !== this.props.bars ||
            nextProps.zoom !== this.props.zoom
        )
    }

    componentDidUpdate () { this.updateAxis() }

    updateAxis () {
        const {
            height,
            width,
            xAxisTickRange,
         } = this.props

        const scale = d3.scale.linear()
            .domain([0, width])
            .range([0, width])

        const xAxis = d3.svg.axis()
            .scale(scale)
            .orient('bottom')
            .innerTickSize(-height)
            .outerTickSize(0)
            .tickValues(xAxisTickRange)
            .tickFormat(() => '')

        d3.select(this.axis).call(xAxis)
    }

    render () {
        const { height } = this.props

        return (
            <g
                className="x axis"
                stroke="#FFF"
                strokeOpacity=".1"
                transform={`translate(0, ${height})`}
                ref={ref => this.axis = ref}
            />
        )
    }
}

export class Y extends Component {
    static propTypes = {
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        bars: PropTypes.number.isRequired,
        interval: PropTypes.object.isRequired,
        zoom: PropTypes.object.isRequired,
        yAxisTickRange: PropTypes.array.isRequired,
    }

    componentDidMount () { this.updateAxis() }

    shouldComponentUpdate (nextProps) {
        return (
            nextProps.width !== this.props.width ||
            nextProps.height !== this.props.height ||
            nextProps.interval !== this.props.interval ||
            nextProps.bars !== this.props.bars ||
            nextProps.zoom !== this.props.zoom
        )
    }

    componentDidUpdate () { this.updateAxis() }

    updateAxis () {
        const {
            height,
            width,
            yAxisTickRange,
         } = this.props

        const scale = d3.scale.linear()
            .domain([0, height])
            .range([height, 0])

        const axis = d3.svg.axis()
            .scale(scale)
            .orient('left')
            .innerTickSize(-width)
            .outerTickSize(0)
            .tickValues(yAxisTickRange)
            .tickFormat(() => '')

        d3.select(this.axis).call(axis)
    }

    render () {
        return (
            <g
                className="y axis"
                stroke="#FFF"
                strokeOpacity=".1"
                ref={ref => this.axis = ref}
            />
        )
    }
}
