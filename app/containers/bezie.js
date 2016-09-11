import { connect } from 'react-redux'
import Bezie from '../components/bezie'
import * as bezieActions from '../actions/bezie'
import * as utils from '../utils'

function mapStateToProps (state) {
    return {
        snap: state.bezie.snap,
        triplet: state.bezie.triplet,
        bars: state.bezie.bars,
        zoom: state.bezie.zoom,
        interval: state.bezie.interval,
        width: utils.getWidth(state.bezie),
        height: utils.getHeight(state.bezie),
        paths: state.bezie.paths,
        pathIdx: state.bezie.pathIdx,
        selectedIdx: state.bezie.selectedIdx,
        xAxisTickRange: getXAxisTickRange(state),
        yAxisTickRange: getYAxisTickRange(state),
    }
}

function getXAxisTickRange (state) {
    const width = utils.getWidth(state.bezie)
    const skip = width / (state.bezie.interval.x * state.bezie.bars)
    return utils.rangeInclusive(0, width, skip)
}

function getYAxisTickRange (state) {
    const height = utils.getHeight(state.bezie)
    const skip = height / state.bezie.interval.y
    return utils.rangeInclusive(0, height, skip)
}

export default connect(mapStateToProps, bezieActions)(Bezie)
