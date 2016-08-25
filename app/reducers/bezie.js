import { TOGGLE_SNAP, ADD_POINT, UPDATE_POINT } from '../actions/bezie'
import Immutable from 'seamless-immutable'

const initialState = Immutable({
    snap: true,
    bars: 4,
    zoom: {
        x: (window.innerWidth - 16 - 12) / (4 * 4 * 96),
        y: 2,
    },
    interval: { x: 4, y: 8 },
    paths: [
        [
            { x: 0, y: 100 },
            { x: 100, y: 100 },
        ],
    ],
    activeIdx: 0,
})

export default function bezie (state = initialState, action) {
    const { payload } = action
    let path
    switch (action.type) {
        case TOGGLE_SNAP:
            return state.set('snap', !state.snap)
        case ADD_POINT:
            path = state.paths[state.activeIdx].asMutable()
            path.splice(payload.index, 0, { x: payload.x, y: payload.y })
            return state.setIn(['paths', state.activeIdx], path)
        case UPDATE_POINT:
            path = state.paths[state.activeIdx].asMutable()
            path[payload.index] = {
                x: payload.x,
                y: payload.y,
            }
            return state.setIn(['paths', state.activeIdx], path)
        default:
            return state
    }
}
