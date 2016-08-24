import _ from 'lodash'

export const rangeInclusive = (start, end, skip) => _.range(start, end + skip, skip)
export const inRangeInclusive = (n, start, end) => _.inRange(n, start, end + 1)
export const takeInner = arr => arr.slice(1, arr.length - 1)
export const getEnum = arr => _.zipObject(arr, arr)
export const factorial = _.memoize(n => _.includes([0, 1], n) ? 1 : n * factorial(n - 1))
export const binomial = (n, i) => i === 0 ? 1 : factorial(n) / (factorial(i) * factorial(n - i))
export const getInsertIndex = (points, x) => {
    return _.indexOf(points, _.last(_.filter(points, point => x > point[0]))) + 1
}