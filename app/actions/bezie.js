export const TOGGLE_SNAP = 'TOGGLE_SNAP'
export const TOGGLE_TRIPLET = 'TOGGLE_TRIPLET'
export const ADD_POINT = 'ADD_POINT'
export const REMOVE_POINT = 'REMOVE_POINT'
export const UPDATE_POINT = 'UPDATE_POINT'
export const CHANGE_PATH = 'CHANGE_PATH'
export const CHANGE_SELECTED = 'CHANGE_SELECTED'
export const CHANGE_TYPE = 'CHANGE_TYPE'
export const RESET_PATH = 'RESET_PATH'
export const REVERSE_PATH = 'REVERSE_PATH'
export const INVERT_PATH = 'INVERT_PATH'
export const INCREASE_X_INTERVAL = 'INCREASE_X_INTERVAL'
export const DECREASE_X_INTERVAL = 'DECREASE_X_INTERVAL'
export const COPY_PATH = 'COPY_PATH'
export const PASTE_PATH = 'PASTE_PATH'

export const addPoint = ({ index, x, y }) => ({ type: ADD_POINT, payload: { index, x, y } })
export const removePoint = ({ index }) => ({ type: REMOVE_POINT, payload: { index } })
export const changePath = ({ index }) => ({ type: CHANGE_PATH, payload: { index } })
export const changeSelected = ({ index }) => ({ type: CHANGE_SELECTED, payload: { index } })
export const changeType = ({ type }) => ({ type: CHANGE_TYPE, payload: { type } })
export const toggleSnap = () => ({ type: TOGGLE_SNAP })
export const toggleTriplet = () => ({ type: TOGGLE_TRIPLET })
export const resetPath = () => ({ type: RESET_PATH })
export const reversePath = () => ({ type: REVERSE_PATH })
export const invertPath = () => ({ type: INVERT_PATH })
export const copyPath = () => ({ type: COPY_PATH })
export const pastePath = () => ({ type: PASTE_PATH })
export const increaseXInterval = () => ({ type: INCREASE_X_INTERVAL })
export const decreaseXInterval = () => ({ type: DECREASE_X_INTERVAL })
export const updatePoint = ({ index, x, y, controlLeft, controlRight, left, right }) => ({
    type: UPDATE_POINT,
    payload: { index, x, y, controlLeft, controlRight, left, right },
})
