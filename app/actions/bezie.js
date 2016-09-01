export const TOGGLE_SNAP = 'TOGGLE_SNAP'
export const ADD_POINT = 'ADD_POINT'
export const REMOVE_POINT = 'REMOVE_POINT'
export const UPDATE_POINT = 'UPDATE_POINT'
export const CHANGE_PATH = 'CHANGE_PATH'
export const RESET_PATH = 'RESET_PATH'

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

export function updatePoint ({ index, x, y }) {
    return {
        type: UPDATE_POINT,
        payload: { index, x, y },
    }
}

export function changePath ({ index }) {
    return {
        type: CHANGE_PATH,
        payload: { index },
    }
}

export function resetPath ({ index }) {
    return {
        type: RESET_PATH,
        payload: { index },
    }
}
