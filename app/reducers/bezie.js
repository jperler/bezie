import Immutable from 'seamless-immutable'
import _ from 'lodash'
import {
    TOGGLE_SNAP,
    TOGGLE_TRIPLET,
    ADD_POINT,
    REMOVE_POINT,
    UPDATE_POINT,
    CHANGE_PATH,
    CHANGE_SELECTED,
    CHANGE_TYPE,
    RESET_PATH,
    REVERSE_PATH,
    INVERT_PATH,
    INCREASE_X_INTERVAL,
    DECREASE_X_INTERVAL,
} from '../actions/bezie'
import * as utils from '../utils'
import * as bezier from '../utils/bezier'

const initialState = Immutable({
    snap: true,
    bars: 4,
    triplet: false,
    zoom: { x: 1, y: 2 },
    interval: { x: 8, y: 10 },
    pathIdx: 0,
    selectedIdx: null,
    paths: _.fill(Array(7), []),
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
        case TOGGLE_TRIPLET: return handleToggleTriplet(state)
        case ADD_POINT: return handleAddPoint(state, payload)
        case REMOVE_POINT: return handleRemovePoint(state, payload)
        case UPDATE_POINT: return handleUpdatePoint(state, payload)
        case CHANGE_PATH: return handleChangePath(state, payload)
        case CHANGE_SELECTED: return handleChangeSelected(state, payload)
        case CHANGE_TYPE: return handleChangeType(state, payload)
        case RESET_PATH: return handleResetPath(state)
        case REVERSE_PATH: return handleReversePath(state)
        case INVERT_PATH: return handleInvertPath(state)
        case INCREASE_X_INTERVAL: return handleIncreaseXInterval(state)
        case DECREASE_X_INTERVAL: return handleDecreaseXInterval(state)
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
        if (utils.getPoint(path, point.left).isControl) {
            // Dragging right control
            state = setCurve([
                utils.getPoint(path, left.left),
                utils.getPoint(path, point.left),
                point,
                right,
            ], state, { index: 2 })
        } else if (utils.getPoint(path, point.right).isControl) {
            // Dragging left control
            state = setCurve([
                left,
                point,
                utils.getPoint(path, point.right),
                utils.getPoint(path, right.right),
            ], state, { index: 1 })
        }
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
    const path = []

    initPath(path, state)

    return state
        .set('selectedIdx', null)
        .setIn(['paths', state.pathIdx], path)
}

function handleReversePath (state) {
    const width = utils.getWidth(state)
    const path = state.paths[state.pathIdx].asMutable()
    const nextPath = path.reverse().map(point => (
        point.merge({
            x: width - point.x,
            left: point.right,
            right: point.left,
        })
    ))

    return state
        .set('selectedIdx', path.length - state.selectedIdx - 1)
        .setIn(['paths', state.pathIdx], nextPath)
}

function handleInvertPath (state) {
    const height = utils.getHeight(state)
    const path = state.paths[state.pathIdx]
    const nextPath = path.map(point => (
        point.set('y', height - point.y)
    ))

    return state.setIn(['paths', state.pathIdx], nextPath)
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

    return setCurve([p0, p1, p1, p2], state)
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

function handleIncreaseXInterval (state) {
    return state.setIn(['interval', 'x'], state.interval.x * 2)
}

function handleDecreaseXInterval (state) {
    return state.setIn(['interval', 'x'], state.interval.x / 2)
}

function handleToggleTriplet (state) {
    const { triplet, interval } = state
    const nextInterval = triplet ? interval.x / 1.5 : interval.x * 1.5

    return state
        .set('triplet', !triplet)
        .setIn(['interval', 'x'], nextInterval)
}

function setCurve ([p0, p1, p2, p3], state, options = {}) {
    const { paths, pathIdx, selectedIdx } = state
    const height = utils.getHeight(state)
    const path = paths[pathIdx].asMutable()
    const i = selectedIdx
    const steps = 32

    if (_.isUndefined(options.updateSelected)) options.updateSelected = true

    if (p1 === p2) {
        const a = bezier.getControl(p0, p1, p3)
        const b = bezier.getPoints([p0, a, p3], steps)
        const li = 1 / 4 * steps
        const ri = 3 / 4 * steps

        p1 = b[li]
        p2 = b[ri]
    }

    const control = bezier.getCubicControlPoints(p0, p1, p2, p3)
    const curve = bezier.getPoints([p0, control[0], control[1], p3], steps)
    const innerCurve = utils.takeInner(curve)
    const midIdx = 1 / 2 * steps
    const mid = curve[midIdx]

    /*
    _.extend(mid, {
        isControl: true,
        left: p0.id,
        right: p2.id,
        id: _.uniqueId('point'),
    })
    */

    const id1 = _.uniqueId('point')
    const id2 = _.uniqueId('point')

    _.extend(curve[steps * 1 / 4], {
        isControl: true,
        id: id1,
        left: p0.id,
        right: id2,
    })

    _.extend(curve[steps * 3 / 4], {
        isControl: true,
        id: id2,
        left: id1,
        right: p3.id,
    })

    innerCurve.map(p => {
        if (!p.isControl) {
            _.extend(p, {
                isCurve: true,
                id: _.uniqueId('point'),
            })
        }

        if (p.y > height) p.y = height
        if (p.y < 0) p.y = 0
        if (p.x < p0.x) p.x = p0.x
        if (p.x > p3.x) p.x = p3.x
    })

    // Dragging p2
    // Ensure curve is valid
    if (options.index === 2) {
        for (let j = steps * 1 / 4, len = steps * 3 / 4; j <= len; j++) {
            if (curve[j].x < curve[j - 1].x) curve[j].x = curve[j - 1].x
        }
    }

    // Dragging p1
    // Ensure curve is valid
    if (options.index === 1) {
        for (let j = steps * 3 / 4; j > 0; j--) {
            if (curve[j].x > curve[j + 1].x) curve[j].x = curve[j + 1].x
        }
    }

    if (p1.isControl || p2.isControl) {
        const leftIdx = _.findIndex(path, p => p.id === p0.id)
        const rightIdx = _.findIndex(path, p => p.id === p3.id)
        path.splice(leftIdx + 1, rightIdx - leftIdx - 1, ...innerCurve)
    } else {
        path.splice(i, 1, ...innerCurve)
    }

    if (options.updateSelected) {
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
