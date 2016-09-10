import Immutable from 'seamless-immutable'
import _ from 'lodash'
import {
    TOGGLE_SNAP,
    ADD_POINT,
    REMOVE_POINT,
    UPDATE_POINT,
    CHANGE_PATH,
    CHANGE_SELECTED,
    CHANGE_TYPE,
    RESET_PATH,
} from '../actions/bezie'
import * as utils from '../utils'
import * as bezier from '../utils/bezier'

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
        if (!path.length) initPath(path, state)
        state = state.setIn(['paths', pathIdx], path)
    }
    switch (action.type) {
        case TOGGLE_SNAP: return handleToggleSnap(state)
        case ADD_POINT: return handleAddPoint(state, payload)
        case REMOVE_POINT: return handleRemovePoint(state, payload)
        case UPDATE_POINT: return handleUpdatePoint(state, payload)
        case CHANGE_PATH: return handleChangePath(state, payload)
        case CHANGE_SELECTED: return handleChangeSelected(state, payload)
        case CHANGE_TYPE: return handleChangeType(state, payload)
        case RESET_PATH: return handleResetPath(state)
        default: return state
    }
}

function handleToggleSnap (state) {
    return state.set('snap', !state.snap)
}

function handleAddPoint (state, payload) {
    const path = state.paths[state.pathIdx].asMutable()
    path.splice(payload.index, 0, {
        x: payload.x,
        y: payload.y,
        id: _.uniqueId('point'),
    })
    return state
        .set('selectedIdx', payload.index)
        .setIn(['paths', state.pathIdx], path)
}

function handleRemovePoint (state, payload) {
    const path = state.paths[state.pathIdx].asMutable()
    const point = path[payload.index]

    if (utils.isEndpoint(path, point)) return state

    if (point.isControl) {
        const leftIdx = _.findIndex(path, p => p.id === point.left)
        const rightIdx = _.findIndex(path, p => p.id === point.right)
        path.splice(leftIdx + 1, rightIdx - leftIdx - 1)
    } else {
        path.splice(payload.index, 1)
    }

    return state
        .set('selectedIdx', null)
        .setIn(['paths', state.pathIdx], path)
}

function handleUpdatePoint (state, payload) {
    const path = _.get(state.paths, state.pathIdx)
    const point = _.get(path, payload.index).asMutable()
    const {
        index,
        x,
        y,
        left,
        right,
        controlLeft,
        controlRight,
    } = payload

    _.extend(point, { x, y })

    state = state.setIn(['paths', state.pathIdx, index], point)

    if (point.isControl) {
        state = setCurve([left, point, right], state)
    } else if (controlRight || controlLeft) {
        if (controlRight) {
            state = setCurve([
                utils.getPoint(path, controlRight.left),
                controlRight,
                point,
            ], state, {
                updateSelected: false,
            })
        }
        if (controlLeft) {
            state = setCurve([
                point,
                controlLeft,
                utils.getPoint(path, controlLeft.right),
            ], state, {
                updateSelected: false,
            })
        }
    }

    return state
}

function handleChangePath (state, payload) {
    const path = state.paths[payload.index].asMutable()
    if (!path.length) initPath(path, state)
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

function handleChangeType (state, payload) {
    switch (payload.type) {
        case 'bezier': return handleSetBezier(state)
        default: return handleSetDefault(state)
    }
}

function handleSetBezier (state) {
    const { paths, pathIdx, selectedIdx } = state
    const path = paths[pathIdx]
    const p0 = path[selectedIdx - 1]
    const p1 = path[selectedIdx]
    const p2 = path[selectedIdx + 1]

    return setCurve([p0, p1, p2], state)
}


function handleSetDefault (state) {
    const { paths, pathIdx, selectedIdx } = state
    const path = paths[pathIdx].asMutable()
    const point = path[selectedIdx]
    const leftIdx = _.findIndex(path, p => p.id === point.left)
    const rightIdx = _.findIndex(path, p => p.id === point.right)
    const nextPoint = point.merge({
        isControl: false,
        left: null,
        right: null,
    })

    path.splice(leftIdx + 1, rightIdx - leftIdx - 1, nextPoint)

    return state
        .set('selectedIdx', leftIdx + 1)
        .setIn(['paths', pathIdx], path)
}

function setCurve ([p0, p1, p2], state, { updateSelected = true } = {}) {
    const { paths, pathIdx, selectedIdx } = state
    const height = utils.getHeight(state)
    const path = paths[pathIdx].asMutable()
    const i = selectedIdx
    const control = bezier.getControl(p0, p1, p2)
    const curve = bezier.getPoints([p0, control, p2])
    const innerCurve = utils.takeInner(curve)
    const midIdx = Math.floor(curve.length / 2)
    const mid = curve[midIdx]

    _.extend(mid, {
        isControl: true,
        left: p0.id,
        right: p2.id,
        id: _.uniqueId('point'),
    })

    innerCurve.map(p => {
        if (p.isControl) return
        p.isCurve = true
        if (p.y > height) p.y = height
        if (p.y < 0) p.y = 0
        if (p.x < p0.x) p.x = p0.x
        if (p.x > p2.x) p.x = p2.x
    })

    if (p1.isControl) {
        const leftIdx = _.findIndex(path, p => p.id === p0.id)
        const rightIdx = _.findIndex(path, p => p.id === p2.id)
        path.splice(leftIdx + 1, rightIdx - leftIdx - 1, ...innerCurve)
    } else {
        path.splice(i, 1, ...innerCurve)
    }

    if (updateSelected) {
        state = state.set('selectedIdx', path.indexOf(mid))
    }

    return state.setIn(['paths', pathIdx], path)
}

function initPath (path, state) {
    const height = utils.getHeight(state)
    const width = utils.getWidth(state)

    path.push(
        { x: 0, y: height, id: _.uniqueId('point') },
        { x: width, y: height, id: _.uniqueId('point') }
    )
}
