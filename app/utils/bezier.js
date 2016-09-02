import _ from 'lodash'
import * as utils from '../utils'

const CHUNKS = 2 ** 5
const INTERVAL = 1 / CHUNKS

export function interpolate (points, t) {
    const n = points.length - 1
    let x = 0
    let y = 0

    for (let i = 0; i <= n; i++) {
        x += utils.binomial(n, i) * ((1 - t) ** (n - i)) * (t ** i) * points[i].x
        y += utils.binomial(n, i) * ((1 - t) ** (n - i)) * (t ** i) * points[i].y
    }

    return { x, y }
}

export function getPoints (points) {
    if (!points.length) return []
    return _.map(utils.rangeInclusive(0, 1, INTERVAL), t => (
        interpolate(points, t)
    ))
}

// Returns the value of the control point with t = 0.5
export function getControl (p0, p1, p2) {
    return new Point(
        2 * p1.x - p0.x / 2 - p2.x / 2,
        2 * p1.y - p0.y / 2 - p2.y / 2
    )
}
