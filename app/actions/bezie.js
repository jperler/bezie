export const TOGGLE_SNAP = 'TOGGLE_SNAP'
export const ADD_POINT = 'ADD_POINT'

export function toggleSnap () {
    return {
        type: TOGGLE_SNAP,
    }
}

export function addPoint ({ index, x, y }) {
    return {
        type: ADD_POINT,
        payload: {
            index,
            x,
            y,
        },
    }
}
