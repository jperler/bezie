import _ from 'lodash'
import * as bezier from '../utils/bezier'
import * as utils from '../utils'
import * as quadratic from '../utils/quadratic'
import { curveTypes } from '../constants'

export function setBezier ([p0, p1, p2, p3], state, options = {}) {
    const { paths, pathIdx, selectedIdx } = state
    const height = utils.getHeight(state)
    const path = paths[pathIdx].asMutable()
    const i = selectedIdx
    const steps = options.steps || 32
    const updateSelected = !_.isUndefined(options.updateSelected) ?
        options.updateSelected : true
    const li = 1 / 4 * steps
    const ri = 3 / 4 * steps

    // Start with a quadratic bezier from a given point since we originate
    // with three points
    if (p1 === p2) {
        const a = quadratic.getControl(p0, p1, p3)
        const b = bezier.getPoints([p0, a, p3], steps)

        p1 = b[li]
        p2 = b[ri]
    }

    const control = getControl(p0, p1, p2, p3)
    const curve = bezier.getPoints([p0, control[0], control[1], p3], steps)
    const innerCurve = utils.takeInner(curve)

    const id1 = _.uniqueId('point')
    const id2 = _.uniqueId('point')

    _.extend(curve[li], {
        isControl: true,
        type: curveTypes.cubic,
        id: id1,
        left: p0.id,
        right: id2,
    })

    _.extend(curve[ri], {
        isControl: true,
        type: curveTypes.cubic,
        id: id2,
        left: id1,
        right: p3.id,
    })

    innerCurve.map(p => {
        if (!p.isControl) {
            _.extend(p, {
                isCurve: true,
                id: _.uniqueId('point'),
            })
        }

        if (p.y > height) p.y = height
        if (p.y < 0) p.y = 0
        if (p.x < p0.x) p.x = p0.x
        if (p.x > p3.x) p.x = p3.x
    })

    // Ensure that all x values are linear
    linearize(innerCurve, curve, steps)

    if (p1.isControl || p2.isControl) {
        const leftIdx = _.findIndex(path, p => p.id === p0.id)
        const rightIdx = _.findIndex(path, p => p.id === p3.id)
        path.splice(leftIdx + 1, rightIdx - leftIdx - 1, ...innerCurve)
    } else {
        path.splice(i, 1, ...innerCurve)
    }

    if (updateSelected) {
        if (options.index === 1) {
            state = state.set('selectedIdx', path.indexOf(curve[steps * 1 / 4]))
        } else if (options.index === 2) {
            state = state.set('selectedIdx', path.indexOf(curve[steps * 3 / 4]))
        }
    }

    return state.setIn(['paths', pathIdx], path)
}

function linearize (innerCurve, curve, steps) {
    const li = steps * 1 / 4 - 1
    const ri = steps * 3 / 4 - 1

    // First quadrant
    if (!isValid(innerCurve.slice(0, li))) {
        for (let j = 0; j < li; j++) {
            innerCurve[j].x = curve[0].x
            innerCurve[j].y = curve[0].y
        }
    }

    // Second quadrant
    if (!isValid(innerCurve.slice(li, ri))) {
        for (let j = li; j < ri; j++) {
            innerCurve[j].x = innerCurve[li].x
            innerCurve[j].y = innerCurve[li].y
        }
    }

    // Third quadrant
    if (!isValid(innerCurve.slice(ri, steps - 2))) {
        for (let j = ri; j < steps - 1; j++) {
            innerCurve[j].x = innerCurve[ri].x
            innerCurve[j].y = innerCurve[ri].y
        }
    }
}

// Returns the value of the control points with value t = 1/4 and t = 3/4
export function getControl (p0, p1, p2, p3) {
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

// Returns whether or not a given set of points is valid
export function isValid (points) {
    for (let i = 0; i < points.length - 1; i++) {
        if (points[i].x > points[i + 1].x) return false
    }
    return true
}
