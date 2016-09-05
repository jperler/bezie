import Immutable from 'seamless-immutable'
import _ from 'lodash'
import {
    TOGGLE_SNAP,
    ADD_POINT,
    REMOVE_POINT,
    UPDATE_POINT,
    CHANGE_PATH,
    CHANGE_SELECTED,
    RESET_PATH,
} from '../actions/bezie'
import * as utils from '../utils'

const initialState = Immutable({
    snap: true,
    bars: 4,
    zoom: { x: 1, y: 2 },
    interval: { x: 8, y: 10 },
    pathIdx: 0,
    selectedIdx: null,
    paths: _.fill(Array(6), []),
})

export default function bezie (state = initialState, action) {
    const { payload } = action
    const { pathIdx, paths } = state
    if (pathIdx === 0 && paths[pathIdx].length === 0) {
        const path = paths[pathIdx].asMutable()
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
        case CHANGE_SELECTED: return handleChangeSelected(state, payload)
        case RESET_PATH: return handleResetPath(state)
        default: return state
    }
}

function handleToggleSnap (state) {
    return state.set('snap', !state.snap)
}

function handleAddPoint (state, payload) {
    const path = state.paths[state.pathIdx].asMutable()
    path.splice(payload.index, 0, { x: payload.x, y: payload.y })
    return state.setIn(['paths', state.pathIdx], path)
}

function handleRemovePoint (state, payload) {
    const path = state.paths[state.pathIdx].asMutable()
    path.splice(payload.index, 1)
    return state.setIn(['paths', state.pathIdx], path)
}

function handleUpdatePoint (state, payload) {
    const path = state.paths[state.pathIdx].asMutable()
    path[payload.index] = { x: payload.x, y: payload.y }
    return state.setIn(['paths', state.pathIdx], path)
}

function handleChangePath (state, payload) {
    const height = utils.getHeight(state)
    const width = utils.getWidth(state)
    const path = state.paths[payload.index].asMutable()
    if (!path.length) {
        path.push({ x: 0, y: height }, { x: width, y: height })
    }
    return state
        .set('pathIdx', payload.index)
        .setIn(['paths', payload.index], path)
}

function handleResetPath (state) {
    const height = utils.getHeight(state)
    const width = utils.getWidth(state)
    return state.setIn(['paths', state.pathIdx], [
        { x: 0, y: height },
        { x: width, y: height },
    ])
}

function handleChangeSelected (state, payload) {
    return state.set('selectedIdx', payload.index)
}
