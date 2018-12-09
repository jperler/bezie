import _ from "lodash";
import { CONTROL_MAX, PPQ, pointTypes } from "../constants";

export const rangeInclusive = (start, end, skip) => _.range(start, end + skip, skip);
export const inRangeInclusive = (n, start, end) => _.inRange(n, start, end + 1);
export const takeInner = arr => arr.slice(1, arr.length - 1);
export const getEnum = arr => _.zipObject(arr, arr);
export const getHeight = ({ zoom }) => CONTROL_MAX * zoom.y;
export const getWidth = ({ bars, zoom }) => PPQ * 4 * bars * zoom.x;
export const numberFormat = n => Math.round(n * 100) / 100;
export const binomial = (n, k) => {
  let coeff = 1;
  for (let i = n - k + 1; i <= n; i++) coeff *= i;
  for (let i = 1; i <= k; i++) coeff /= i;
  return coeff;
};

// Gets insert index within endpoints
export const getInsertIndex = (points, x) =>
  _.indexOf(points, _.last(_.filter(points, point => x >= point.x))) + (x === points[points.length - 1].x ? -1 : 1);

export const getGridPoint = (point, xRange, yRange) => ({
  x: _.minBy(xRange, tick => Math.abs(point.x - tick)),
  y: _.minBy(yRange, tick => Math.abs(point.y - tick))
});

export const normalizePoint = ({ point, height, zoom }) => ({
  x: point.x / zoom.x / PPQ,
  y: (height - point.y) / zoom.y
});

export const getPoint = (path, id) => _.find(path, p => p.id === id);
export const isPathEndpoint = (path, i) => i === 0 || i === path.length - 1;
export const isEndpoint = (path, point) => {
  if (_.has(point, "type") && _.includes(pointTypes, point.type)) return false;
  return !!path.find(p => _.includes([p.left, p.right], point.id));
};
