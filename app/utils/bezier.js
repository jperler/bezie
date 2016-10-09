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

export function getPoints (points, steps) {
    if (!points.length) return []
    const interval = 1 / steps
    return _.map(utils.rangeInclusive(0, 1, interval), t => (
        interpolate(points, t)
    ))
}
