import _ from "lodash";
import * as bezier from "../utils/bezier";
import * as utils from "../utils";
import { pointTypes, SESSION_ID } from "../constants";

export function setBezier([p0, p1, p2], state, options) {
  const { paths, pathIdx, selectedIdx } = state;
  const height = utils.getHeight(state);
  const path = paths[pathIdx].asMutable();
  const i = selectedIdx;
  const steps = options.steps || 64;
  const updateSelected = !_.isUndefined(options.updateSelected) ? options.updateSelected : true;
  const control = getControl(p0, p1, p2);
  const curve = bezier.getPoints([p0, control, p2], steps);
  const innerCurve = utils.takeInner(curve);
  const mid = curve[steps / 2];

  _.extend(mid, {
    isControl: true,
    type: pointTypes.quadratic,
    left: p0.id,
    right: p2.id,
    id: _.uniqueId(SESSION_ID)
  });

  innerCurve.map(p => {
    if (p.isControl) return;
    p.hidden = true;
    if (p.y > height) p.y = height;
    if (p.y < 0) p.y = 0;
    if (p.x < p0.x) p.x = p0.x;
    if (p.x > p2.x) p.x = p2.x;
  });

  if (p1.isControl) {
    const leftIdx = _.findIndex(path, p => p.id === p0.id);
    const rightIdx = _.findIndex(path, p => p.id === p2.id);
    path.splice(leftIdx + 1, rightIdx - leftIdx - 1, ...innerCurve);
  } else {
    path.splice(i, 1, ...innerCurve);
  }

  if (updateSelected) {
    state = state.set("selectedIdx", path.indexOf(mid));
  }

  return state.setIn(["paths", pathIdx], path);
}

// Returns the value of the control point with t = 1/2
export function getControl(p0, p1, p2) {
  return {
    x: 2 * p1.x - p0.x / 2 - p2.x / 2,
    y: 2 * p1.y - p0.y / 2 - p2.y / 2
  };
}
