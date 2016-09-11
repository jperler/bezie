export const TOGGLE_SNAP = 'TOGGLE_SNAP'
export const ADD_POINT = 'ADD_POINT'
export const REMOVE_POINT = 'REMOVE_POINT'
export const UPDATE_POINT = 'UPDATE_POINT'
export const CHANGE_PATH = 'CHANGE_PATH'
export const CHANGE_SELECTED = 'CHANGE_SELECTED'
export const CHANGE_TYPE = 'CHANGE_TYPE'
export const RESET_PATH = 'RESET_PATH'
export const INCREASE_X_INTERVAL = 'INCREASE_X_INTERVAL'
export const DECREASE_X_INTERVAL = 'DECREASE_X_INTERVAL'

export function toggleSnap () {
    return {
        type: TOGGLE_SNAP,
    }
}

export function addPoint ({ index, x, y }) {
    return {
        type: ADD_POINT,
        payload: { index, x, y },
    }
}

export function removePoint ({ index }) {
    return {
        type: REMOVE_POINT,
        payload: { index },
    }
}

export function updatePoint (options) {
    const { index, x, y, controlLeft, controlRight, left, right } = options
    return {
        type: UPDATE_POINT,
        payload: { index, x, y, controlLeft, controlRight, left, right },
    }
}

export function changePath ({ index }) {
    return {
        type: CHANGE_PATH,
        payload: { index },
    }
}

export function changeSelected ({ index }) {
    return {
        type: CHANGE_SELECTED,
        payload: { index },
    }
}

export function changeType ({ type }) {
    return {
        type: CHANGE_TYPE,
        payload: { type },
    }
}

export function resetPath () {
    return {
        type: RESET_PATH,
        payload: {},
    }
}

export function increaseXInterval () {
    return { type: INCREASE_X_INTERVAL, payload: {} }
}

export function decreaseXInterval () {
    return { type: DECREASE_X_INTERVAL, payload: {} }
}
