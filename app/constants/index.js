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
export const NUM_PATHS = 8
export const NUM_CC_CHANNELS = 119
export const WIN_MIDI_ERROR = `Please install loopmidi with the following device: "${VIRTUAL_PORT_NAME}".`// eslint-disable-line

export const colors = [
    '#FD1C03',
    '#FF6600',
    '#FFFF00',
    '#00FF00',
    '#00FFFF',
    '#0062FF',
    '#CC00FF',
    '#FFFFFF',
]

export const pointTypes = {
    quadratic: 'quadratic',
    cubic: 'cubic',
}

export const modes = {
    clock: 'clock',
    controller: 'controller',
}
