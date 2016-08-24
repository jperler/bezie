import { TOGGLE_SNAP, ADD_POINT } from '../actions/bezie'
import Immutable from 'seamless-immutable'

const initialState = Immutable({
    snap: true,
    bars: 4,
    zoom: { x: .8, y: 2 },
    interval: { x: 4, y: 16 },
    paths: [
        [[0 , 100], [100, 100]],
        [[100 , 50], [200, 50]],
    ],
    activePath: 0,
})

export default function bezie (state = initialState, action) {
    const { payload } = action
    switch (action.type) {
        case TOGGLE_SNAP:
            state.snap = !state.snap
            return state
        case ADD_POINT:
            return state.setIn(['paths', state.activePath],
                state.paths[state.activePath].concat([[payload.x, payload.y]]))
        default:
            return state
    }
}
