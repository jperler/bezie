import _ from 'lodash'
import { CONTROL_MAX, PPQ } from '../constants'

export const rangeInclusive = (start, end, skip) => _.range(start, end + skip, skip)
export const inRangeInclusive = (n, start, end) => _.inRange(n, start, end + 1)
export const takeInner = arr => arr.slice(1, arr.length - 1)
export const getEnum = arr => _.zipObject(arr, arr)
export const factorial = _.memoize(n => (_.includes([0, 1], n) ? 1 : n * factorial(n - 1)))
export const binomial = (n, i) => (i === 0 ? 1 : factorial(n) / (factorial(i) * factorial(n - i)))
export const getHeight = ({ zoom }) => CONTROL_MAX * zoom.y
export const getWidth = ({ bars, zoom }) => PPQ * 4 * bars * zoom.x

export const getInsertIndex = (points, x) => (
    _.indexOf(points, _.last(_.filter(points, point => x > point.x))) + 1
)

export const getGridPoint = (point, xRange, yRange) => ({
    x: _.minBy(xRange, tick => Math.abs(point.x - tick)),
    y: _.minBy(yRange, tick => Math.abs(point.y - tick)),
})
