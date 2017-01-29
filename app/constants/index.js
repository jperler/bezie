import crypto from 'crypto'

export const CONTROL_MAX = 127
export const PPQ = 96
export const MIN_BARS = 1
export const MAX_BARS = 16
export const ZOOM_FACTOR = 0.2
export const STORAGE_KEY = '5ecc381f0692823cb628ce3a15bce02c'
export const SESSION_ID = crypto.randomBytes(8).toString('hex')
export const ACTIVATION_BASE_URL = 'http://bezie-activation.herokuapp.com'
export const RELEASE_BASE_URL = 'http://bezie-release.herokuapp.com'
export const SECRET_FRAGMENT = '7kZiZynrndu'
export const VIRTUAL_PORT_NAME = 'Bezie'
export const WIN_MIDI_ERROR = `Please install loopmidi with the following devices: "${VIRTUAL_PORT_NAME} in" and "${VIRTUAL_PORT_NAME} out".`// eslint-disable-line

export const colors = [
    '#FD1C03',
    '#FF6600',
    '#FFFF00',
    '#00FF00',
    '#00FFFF',
    '#0062FF',
    '#CC00FF',
]

export const pointTypes = {
    quadratic: 'quadratic',
    cubic: 'cubic',
}
