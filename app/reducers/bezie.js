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
import * as cubic from '../utils/cubic'
import * as quadratic from '../utils/quadratic'
import { pointTypes } from '../constants'

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

    if (_.includes(pointTypes, point.type)) {
        let leftIdx
        let rightIdx
        if (point.type === pointTypes.quadratic || point.type === pointTypes.saw) {
            leftIdx = _.findIndex(path, p => p.id === point.left)
            rightIdx = _.findIndex(path, p => p.id === point.right)
        } else {
            const left = utils.getPoint(path, point.left)
            const right = utils.getPoint(path, point.right)

            if (left.isControl) {
                // Removing with p1 selected
                leftIdx = _.findIndex(path, p => p.id === left.left)
                rightIdx = _.findIndex(path, p => p.id === point.right)
            } else {
                // Removing with p0 selected
                leftIdx = _.findIndex(path, p => p.id === point.left)
                rightIdx = _.findIndex(path, p => p.id === right.right)
            }
        }

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

    if (point.type === 'saw') {
        return handleSetSaw(state)
    }

    if (point.isControl) {
        if (point.type === pointTypes.quadratic) {
            state = setBezier([left, point, right], state)
        } else {
            if (utils.getPoint(path, point.left).isControl) {
                // Dragging p1
                state = setBezier([
                    utils.getPoint(path, left.left),
                    utils.getPoint(path, point.left),
                    point,
                    right,
                ], state, { index: 2 })
            } else if (utils.getPoint(path, point.right).isControl) {
                // Dragging p0
                state = setBezier([
                    left,
                    point,
                    utils.getPoint(path, point.right),
                    utils.getPoint(path, right.right),
                ], state, { index: 1 })
            }
        }
    } else if (controlRight || controlLeft) {
        // Dragging the right endpoint of a curve
        if (controlRight) {
            if (controlRight.type === pointTypes.quadratic) {
                state = setBezier([
                    utils.getPoint(path, controlRight.left),
                    controlRight,
                    point,
                ], state, { updateSelected: false })
            } else {
                state = setBezier([
                    utils.getPoint(path, utils.getPoint(path, controlRight.left).left),
                    utils.getPoint(path, controlRight.left),
                    controlRight,
                    point,
                ], state, { updateSelected: false })
            }
        }
        // Dragging the left endpoint of a curve
        if (controlLeft) {
            if (controlLeft.type === pointTypes.quadratic) {
                state = setBezier([
                    point,
                    controlLeft,
                    utils.getPoint(path, controlLeft.right),
                ], state, { updateSelected: false })
            } else {
                state = setBezier([
                    point,
                    controlLeft,
                    utils.getPoint(path, controlLeft.right),
                    utils.getPoint(path, utils.getPoint(path, controlLeft.right).right),
                ], state, { updateSelected: false })
            }
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
    const nextSelectedIdx = _.isNumber(state.selectedIdx) ?
        path.length - state.selectedIdx - 1 : null
    const nextPath = path.reverse().map(point => (
        point.merge({
            x: width - point.x,
            left: point.right,
            right: point.left,
        })
    ))

    return state
        .set('selectedIdx', nextSelectedIdx)
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
        case pointTypes.quadratic:
        case pointTypes.cubic:
            return handleSetBezier(state, payload)
        case pointTypes.saw: return handleSetSaw(state, payload)
        default: return handleSetDefault(state)
    }
}

function handleSetBezier (state, { type }) {
    const { paths, pathIdx, selectedIdx } = state
    const path = paths[pathIdx]
    const p0 = path[selectedIdx - 1]
    const p1 = path[selectedIdx]
    const p2 = path[selectedIdx + 1]
    const points = type === 'cubic' ?
        [p0, p1, p1, p2] : [p0, p1, p2]

    return setBezier(points, state)
}


function handleSetDefault (state) {
    const { paths, pathIdx, selectedIdx } = state
    const path = paths[pathIdx].asMutable()
    const point = path[selectedIdx]

    let leftIdx
    let rightIdx
    if (_.includes([pointTypes.quadratic, pointTypes.saw], point.type)) {
        leftIdx = _.findIndex(path, p => p.id === point.left)
        rightIdx = _.findIndex(path, p => p.id === point.right)
    } else {
        // Setting default on a cubic bezier
        const left = utils.getPoint(path, point.left)
        const right = utils.getPoint(path, point.right)
        if (left.isControl) {
            // Setting default with p1 selected
            leftIdx = _.findIndex(path, p => p.id === left.left)
            rightIdx = _.findIndex(path, p => p.id === point.right)
        } else {
            // Setting default with p0 selected
            leftIdx = _.findIndex(path, p => p.id === point.left)
            rightIdx = _.findIndex(path, p => p.id === right.right)
        }
    }

    const nextPoint = point.merge({
        isControl: false,
        left: null,
        right: null,
        type: null,
    })

    path.splice(leftIdx + 1, rightIdx - leftIdx - 1, nextPoint)

    return state
        .set('selectedIdx', leftIdx + 1)
        .setIn(['paths', pathIdx], path)
}

function handleSetSaw (state) {
    const path = state.paths[state.pathIdx].asMutable()
    const selected = path[state.selectedIdx]

    let leftIdx
    let rightIdx
    if (selected.type === 'saw' && selected.left && selected.right) {
        leftIdx = _.findIndex(path, p => p.id === selected.left)
        rightIdx = _.findIndex(path, p => p.id === selected.right)
    } else {
        leftIdx = state.selectedIdx - 1
        rightIdx = state.selectedIdx + 1
    }

    const left = path[leftIdx]
    const right = path[rightIdx]
    const width = utils.getWidth(state)
    // Enforce a maximum of 64 peaks per bar
    const min = width / state.bars / 128
    const delta = _.max([min, selected.x - left.x])
    const points = []

    if (selected.x === right.x) return state

    _.map(_.range(selected.x, right.x, delta), (x, i) => {
        points.push({
            x,
            y: i % 2 === 0 ? selected.y : left.y,
            id: _.uniqueId('point'),
            hidden: i > 0,
            type: i === 0 ? 'saw' : null,
            left: left.id,
            right: right.id,
        })
    })

    path.splice(leftIdx + 1, rightIdx - leftIdx - 1, ...points)

    return state
        .setIn(['paths', state.pathIdx], path)
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

function setBezier (points, state, options = {}) {
    switch (points.length) {
        case 3: return quadratic.setBezier(points, state, options)
        case 4: return cubic.setBezier(points, state, options)
        default: return state
    }
}

function initPath (path, state) {
    const height = utils.getHeight(state)
    const width = utils.getWidth(state)

    path.push(
        { x: 0, y: height, id: _.uniqueId('point') },
        { x: width, y: height, id: _.uniqueId('point') }
    )
}
