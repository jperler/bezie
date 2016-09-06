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
    snap: false,
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
    path.splice(payload.index, 0, { x: payload.x, y: payload.y })
    return state.setIn(['paths', state.pathIdx], path)
}

function handleRemovePoint (state, payload) {
    const path = state.paths[state.pathIdx].asMutable()
    path.splice(payload.index, 1)
    return state.setIn(['paths', state.pathIdx], path)
}

function handleUpdatePoint (state, payload) {
    const path = _.get(state.paths, state.pathIdx)
    const point = _.get(path, payload.index).asMutable()

    const controlLeft = _.find(path, p => p.isControl && p.left === point)
    const controlRight = _.find(path, p => p.isControl && p.right === point)

    _.extend(point, { x: payload.x, y: payload.y })

    if (point.isControl) {
        return handleSetCurve([point.left, point, point.right], state)
    } else if (controlLeft) {
        console.log('controlLEft')
        return handleSetCurve([point, controlLeft, controlLeft.right], state, {
            updateSelected: false,
        })
    } else if (controlRight) {
        return handleSetCurve([controlRight.left, controlRight, point], state, {
            updateSelected: false,
        })
    }

    return state.setIn(['paths', state.pathIdx, payload.index], point)
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

function handleChangeType (state, payload) {
    switch (payload.type) {
        case 'bezier': return handleSetBezier(state)
        default: return handleSetDefault(state)
    }
}

function handleSetCurve ([p0, p1, p2], state, { updateSelected = true } = {}) {
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
        left: p0,
        right: p2,
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
        const leftIdx = path.indexOf(p0)
        const rightIdx = path.indexOf(p2)
        path.splice(leftIdx + 1, rightIdx - leftIdx - 1, ...innerCurve)
    } else {
        path.splice(i, 1, ...innerCurve)
    }

    if (updateSelected) {
        state = state.set('selectedIdx', path.indexOf(mid))
    }

    return state.setIn(['paths', pathIdx], path)
}

function handleSetBezier (state) {
    const { paths, pathIdx, selectedIdx } = state
    const path = paths[pathIdx]
    const p0 = path[selectedIdx - 1]
    const p1 = path[selectedIdx]
    const p2 = path[selectedIdx + 1]
    return handleSetCurve([p0, p1, p2], state)
}

function handleSetDefault (state) {
    return state
}
