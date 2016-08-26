import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Bezie from '../components/bezie'
import * as bezieActions from '../actions/bezie'
import * as utils from '../utils'

function mapStateToProps (state) {
    return {
        snap: state.bezie.snap,
        bars: state.bezie.bars,
        zoom: state.bezie.zoom,
        interval: state.bezie.interval,
        width: getWidth(state),
        height: getHeight(state),
        paths: state.bezie.paths,
        pathIdx: state.bezie.pathIdx,
        xAxisTickRange: getXAxisTickRange(state),
        yAxisTickRange: getYAxisTickRange(state),
    }
}

function getHeight (state) {
    return 127 * state.bezie.zoom.y
}

function getWidth (state) {
    return 96 * 4 * state.bezie.bars * state.bezie.zoom.x
}

function getXAxisTickRange (state) {
    const width = getWidth(state)
    const skip = width / (state.bezie.interval.x * state.bezie.bars)
    return utils.rangeInclusive(0, width, skip)
}

function getYAxisTickRange (state) {
    const height = getHeight(state)
    const skip = height / state.bezie.interval.y
    return utils.rangeInclusive(0, height, skip)
}

export default connect(mapStateToProps, bezieActions)(Bezie)
