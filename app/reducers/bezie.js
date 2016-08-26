import { TOGGLE_SNAP, ADD_POINT, UPDATE_POINT } from '../actions/bezie'
import Immutable from 'seamless-immutable'
import _ from 'lodash'

const initialState = Immutable({
    snap: true,
    bars: 4,
    zoom: { x: 1, y: 2 },
    interval: { x: 8, y: 4 },
    pathIdx: 1,
    paths: _.fill(Array(5), []),
})

export default function bezie (state = initialState, action) {
    const { payload } = action
    switch (action.type) {
        case TOGGLE_SNAP: return handleToggleSnap(state)
        case ADD_POINT: return handleAddPoint(state, payload)
        case UPDATE_POINT: return handleUpdatePoint(state, payload)
        default: return state
    }
}

function handleToggleSnap (state) {
    return state.set('snap', !state.snap)
}

function handleAddPoint (state, payload) {
    let path = state.paths[state.pathIdx].asMutable()
    path.splice(payload.index, 0, { x: payload.x, y: payload.y })
    return state.setIn(['paths', state.pathIdx], path)
}

function handleUpdatePoint (state, payload) {
    let path = state.paths[state.pathIdx].asMutable()
    path[payload.index] = { x: payload.x, y: payload.y }
    return state.setIn(['paths', state.pathIdx], path)
}
