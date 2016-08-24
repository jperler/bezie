import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Bezie from '../components/bezie'
import * as bezieActions from '../actions/bezie'

function mapStateToProps (state) {
    return {
        snap: state.bezie.snap,
        bars: state.bezie.bars,
        zoom: state.bezie.zoom,
        interval: state.bezie.interval,
        width: 96 * 4 * state.bezie.bars * state.bezie.zoom.x,
        height: 127 * state.bezie.zoom.y,
        paths: state.bezie.paths,
        activeIdx: state.bezie.activeIdx,
    }
}

export default connect(mapStateToProps, bezieActions)(Bezie)
