import _ from 'lodash'
import * as utils from '../utils'

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

export function getPoints (points, steps = 16) {
    if (!points.length) return []
    const interval = 1 / steps
    return _.map(utils.rangeInclusive(0, 1, interval), t => (
        interpolate(points, t)
    ))
}

// Returns the value of the control point with t = 1/2
export function getControl (p0, p1, p2) {
    return {
        x: 2 * p1.x - p0.x / 2 - p2.x / 2,
        y: 2 * p1.y - p0.y / 2 - p2.y / 2
    }
}

// Returns the value of the control points with value t = 1/4 and t = 3/4
export function getCubicControlPoints (p0, p1, p2, p3) {
    return [
        {
            x: (1 / 9) * (-10 * p0.x + 24 * p1.x - 8 * p2.x + 3 * p3.x),
            y: (1 / 9) * (-10 * p0.y + 24 * p1.y - 8 * p2.y + 3 * p3.y),
        },
        {
            x: (1 / 9) * (3 * p0.x - 8 * p1.x + 24 * p2.x - 10 * p3.x),
            y: (1 / 9) * (3 * p0.y - 8 * p1.y + 24 * p2.y - 10 * p3.y),
        },
    ]
}
