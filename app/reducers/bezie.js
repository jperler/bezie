import {
    TOGGLE_SNAP,
    ADD_POINT,
    REMOVE_POINT,
    UPDATE_POINT,
    CHANGE_PATH,
} from '../actions/bezie'
import Immutable from 'seamless-immutable'
import _ from 'lodash'
import * as utils from '../utils'

const initialState = Immutable({
    snap: true,
    bars: 4,
    zoom: { x: 1, y: 2 },
    interval: { x: 8, y: 4 },
    pathIdx: 0,
    paths: _.fill(Array(6), []),
})

export default function bezie (state = initialState, action) {
    const { payload } = action
    const { pathIdx, paths } = state
    if (pathIdx === 0 && paths[pathIdx].length === 0) {
        let path = paths[pathIdx].asMutable()
        const height = utils.getHeight(state)
        const width = utils.getWidth(state)
        if (!path.length) {
            path.push({ x: 0, y: height }, { x: width, y: height })
        }
        state = state.setIn(['paths', pathIdx], path)
    }
    switch (action.type) {
        case TOGGLE_SNAP: return handleToggleSnap(state)
        case ADD_POINT: return handleAddPoint(state, payload)
        case REMOVE_POINT: return handleRemovePoint(state, payload)
        case UPDATE_POINT: return handleUpdatePoint(state, payload)
        case CHANGE_PATH: return handleChangePath(state, payload)
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

function handleRemovePoint (state, payload) {
    let path = state.paths[state.pathIdx].asMutable()
    path.splice(payload.index, 1)
    return state.setIn(['paths', state.pathIdx], path)
}

function handleUpdatePoint (state, payload) {
    let path = state.paths[state.pathIdx].asMutable()
    path[payload.index] = { x: payload.x, y: payload.y }
    return state.setIn(['paths', state.pathIdx], path)
}

function handleChangePath (state, payload) {
    const height = utils.getHeight(state)
    const width = utils.getWidth(state)
    let path = state.paths[payload.index].asMutable()
    if (!path.length) {
        path.push({ x: 0, y: height }, { x: width, y: height })
    }
    return state
        .set('pathIdx', payload.index)
        .setIn(['paths', payload.index], path)
}
