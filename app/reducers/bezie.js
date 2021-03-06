import Immutable from "seamless-immutable";
import _ from "lodash";
import {
  TOGGLE_SNAP,
  TOGGLE_TRIPLET,
  ADD_POINT,
  REMOVE_POINT,
  UPDATE_POINT,
  CHANGE_PATH,
  CHANGE_SELECTED,
  CHANGE_TYPE,
  RESET_PATH,
  REVERSE_PATH,
  INVERT_PATH,
  COPY_PATH,
  PASTE_PATH,
  INCREASE_X_INTERVAL,
  DECREASE_X_INTERVAL,
  INCREASE_BARS,
  DECREASE_BARS,
  ZOOM_IN,
  ZOOM_OUT,
  BOOTSTRAP,
  UPDATE_SETTINGS
} from "../actions/bezie";
import * as utils from "../utils";
import * as cubic from "../utils/cubic";
import * as quadratic from "../utils/quadratic";
import { pointTypes, modes, MIN_BARS, MAX_BARS, ZOOM_FACTOR, SESSION_ID, NUM_PATHS } from "../constants";
import { PITCH } from "../constants/midi";

const initialState = Immutable({
  snap: true,
  bars: 4,
  triplet: false,
  zoom: { x: 1, y: 2 },
  interval: { x: 8, y: 10 },
  pathIdx: 0,
  selectedIdx: null,
  clipboard: { path: null },
  paths: _.fill(Array(NUM_PATHS), []),
  settings: {
    tempo: 120,
    mode: modes.clock,
    mappings: {},
    controllerName: null,
    midi: _.map(_.range(NUM_PATHS), i => ({
      name: "",
      channel: i + 1
    }))
  }
});

export default function bezie(state = initialState, action) {
  const { payload } = action;
  const { pathIdx, paths } = state;
  if (pathIdx === 0 && paths[pathIdx].length === 0) {
    const path = paths[pathIdx].asMutable();
    if (!path.length) initPath(path, state);
    state = state.setIn(["paths", pathIdx], path);
  }

  // Update the title to indicate file status
  if (
    _.includes(
      [
        ADD_POINT,
        REMOVE_POINT,
        UPDATE_POINT,
        REMOVE_POINT,
        CHANGE_TYPE,
        RESET_PATH,
        REVERSE_PATH,
        INVERT_PATH,
        PASTE_PATH,
        UPDATE_SETTINGS
      ],
      action.type
    )
  ) {
    if (document.title === "Bezie") {
      document.title = "* untitled";
    } else if (document.title[0] !== "*") {
      document.title = `* ${document.title}`;
    }
  }

  switch (action.type) {
    case TOGGLE_SNAP:
      return handleToggleSnap(state);
    case TOGGLE_TRIPLET:
      return handleToggleTriplet(state);
    case ADD_POINT:
      return handleAddPoint(state, payload);
    case REMOVE_POINT:
      return handleRemovePoint(state, payload);
    case UPDATE_POINT:
      return handleUpdatePoint(state, payload);
    case CHANGE_PATH:
      return handleChangePath(state, payload);
    case CHANGE_SELECTED:
      return handleChangeSelected(state, payload);
    case CHANGE_TYPE:
      return handleChangeType(state, payload);
    case RESET_PATH:
      return handleResetPath(state);
    case REVERSE_PATH:
      return handleReversePath(state);
    case INVERT_PATH:
      return handleInvertPath(state);
    case INCREASE_X_INTERVAL:
      return handleIncreaseXInterval(state);
    case DECREASE_X_INTERVAL:
      return handleDecreaseXInterval(state);
    case COPY_PATH:
      return handleCopyPath(state);
    case PASTE_PATH:
      return handlePastePath(state);
    case INCREASE_BARS:
      return handleIncreaseBars(state);
    case DECREASE_BARS:
      return handleDecreaseBars(state);
    case ZOOM_IN:
      return handleZoomIn(state);
    case ZOOM_OUT:
      return handleZoomOut(state);
    case BOOTSTRAP:
      return handleBootstrap(state, payload);
    case UPDATE_SETTINGS:
      return handleUpdateSettings(state, payload);
    default:
      return state;
  }
}

function handleToggleSnap(state) {
  return state.set("snap", !state.snap);
}

function handleAddPoint(state, payload) {
  const path = state.paths[state.pathIdx].asMutable();

  path.splice(payload.index, 0, {
    x: payload.x,
    y: payload.y,
    id: _.uniqueId(SESSION_ID)
  });

  return state.set("selectedIdx", payload.index).setIn(["paths", state.pathIdx], path);
}

function handleRemovePoint(state, payload) {
  const path = state.paths[state.pathIdx].asMutable();
  const point = path[payload.index];

  if (utils.isEndpoint(path, point)) return state;

  if (_.includes(pointTypes, point.type)) {
    let leftIdx;
    let rightIdx;
    if (point.type !== pointTypes.cubic) {
      leftIdx = _.findIndex(path, p => p.id === point.left);
      rightIdx = _.findIndex(path, p => p.id === point.right);
    } else {
      // Cubic types are special since they have two controllable points
      const left = utils.getPoint(path, point.left);
      const right = utils.getPoint(path, point.right);

      if (left.isControl) {
        // Removing with p1 selected
        leftIdx = _.findIndex(path, p => p.id === left.left);
        rightIdx = _.findIndex(path, p => p.id === point.right);
      } else {
        // Removing with p0 selected
        leftIdx = _.findIndex(path, p => p.id === point.left);
        rightIdx = _.findIndex(path, p => p.id === right.right);
      }
    }

    path.splice(leftIdx + 1, rightIdx - leftIdx - 1);
  } else {
    path.splice(payload.index, 1);
  }

  return state.set("selectedIdx", null).setIn(["paths", state.pathIdx], path);
}

function handleUpdatePoint(state, payload) {
  const path = _.get(state.paths, state.pathIdx);
  const point = _.get(path, payload.index).asMutable();

  const { index, x, y, left, right, controlLeft, controlRight } = payload;

  _.extend(point, { x, y });

  state = state.setIn(["paths", state.pathIdx, index], point);

  if (point.isControl) {
    if (point.type === pointTypes.quadratic) {
      state = setBezier([left, point, right], state);
    } else if (utils.getPoint(path, point.left).isControl) {
      // Dragging p1
      state = setBezier([utils.getPoint(path, left.left), utils.getPoint(path, point.left), point, right], state, {
        index: 2
      });
    } else if (utils.getPoint(path, point.right).isControl) {
      // Dragging p0
      state = setBezier([left, point, utils.getPoint(path, point.right), utils.getPoint(path, right.right)], state, {
        index: 1
      });
    }
  } else if (controlRight || controlLeft) {
    // Dragging the right endpoint of a curve
    if (controlRight) {
      if (controlRight.type === pointTypes.quadratic) {
        state = setBezier([utils.getPoint(path, controlRight.left), controlRight, point], state, {
          updateSelected: false
        });
      } else {
        state = setBezier(
          [
            utils.getPoint(path, utils.getPoint(path, controlRight.left).left),
            utils.getPoint(path, controlRight.left),
            controlRight,
            point
          ],
          state,
          { updateSelected: false }
        );
      }
    }
    // Dragging the left endpoint of a curve
    if (controlLeft) {
      if (controlLeft.type === pointTypes.quadratic) {
        state = setBezier([point, controlLeft, utils.getPoint(path, controlLeft.right)], state, {
          updateSelected: false
        });
      } else {
        state = setBezier(
          [
            point,
            controlLeft,
            utils.getPoint(path, controlLeft.right),
            utils.getPoint(path, utils.getPoint(path, controlLeft.right).right)
          ],
          state,
          { updateSelected: false }
        );
      }
    }
  }

  return state;
}

function handleChangePath(state, payload) {
  const path = state.paths[payload.index].asMutable();
  const bipolar = state.settings.midi[payload.index].channel === PITCH;
  if (!path.length) initPath(path, state, bipolar);
  return state.set("pathIdx", payload.index).setIn(["paths", payload.index], path);
}

function handleResetPath(state) {
  const path = [];
  const bipolar = state.settings.midi[state.pathIdx].channel === PITCH;

  initPath(path, state, bipolar);

  return state.set("selectedIdx", null).setIn(["paths", state.pathIdx], path);
}

function handleReversePath(state) {
  const width = utils.getWidth(state);
  const path = state.paths[state.pathIdx].asMutable();
  const nextSelectedIdx = _.isNumber(state.selectedIdx) ? path.length - state.selectedIdx - 1 : null;
  const nextPath = path.reverse().map(point =>
    point.merge({
      x: width - point.x,
      left: point.right,
      right: point.left
    })
  );

  return state.set("selectedIdx", nextSelectedIdx).setIn(["paths", state.pathIdx], nextPath);
}

function handleInvertPath(state) {
  const height = utils.getHeight(state);
  const path = state.paths[state.pathIdx];
  const nextPath = path.map(point => point.set("y", height - point.y));

  return state.setIn(["paths", state.pathIdx], nextPath);
}

function handleChangeSelected(state, payload) {
  return state.set("selectedIdx", payload.index);
}

function handleChangeType(state, payload) {
  switch (payload.type) {
    case pointTypes.quadratic:
    case pointTypes.cubic:
      return handleSetBezier(state, payload);
    default:
      return handleSetDefault(state);
  }
}

function handleSetBezier(state, { type }) {
  const { paths, pathIdx, selectedIdx } = state;
  const path = paths[pathIdx];
  const p0 = path[selectedIdx - 1];
  const p1 = path[selectedIdx];
  const p2 = path[selectedIdx + 1];
  const points = type === "cubic" ? [p0, p1, p1, p2] : [p0, p1, p2];

  return setBezier(points, state);
}

function handleSetDefault(state) {
  const { paths, pathIdx, selectedIdx } = state;
  const path = paths[pathIdx].asMutable();
  let point = path[selectedIdx];

  let leftIdx;
  let rightIdx;
  if (point.type !== pointTypes.cubic) {
    leftIdx = _.findIndex(path, p => p.id === point.left);
    rightIdx = _.findIndex(path, p => p.id === point.right);
  } else {
    // Setting default on a cubic bezier
    const left = utils.getPoint(path, point.left);
    const right = utils.getPoint(path, point.right);
    if (left.isControl) {
      // Setting default with p1 selected
      leftIdx = _.findIndex(path, p => p.id === left.left);
      rightIdx = _.findIndex(path, p => p.id === point.right);
    } else {
      // Setting default with p0 selected
      leftIdx = _.findIndex(path, p => p.id === point.left);
      rightIdx = _.findIndex(path, p => p.id === right.right);
    }
    // Leave mid point in place
    const mid = (rightIdx - leftIdx) / 2 + leftIdx;
    point = path[mid];
  }

  const nextPoint = point.merge({
    isControl: false,
    left: null,
    right: null,
    type: null,
    hidden: null
  });

  path.splice(leftIdx + 1, rightIdx - leftIdx - 1, nextPoint);

  return state.set("selectedIdx", leftIdx + 1).setIn(["paths", pathIdx], path);
}

function handleIncreaseXInterval(state) {
  return state.setIn(["interval", "x"], state.interval.x * 2);
}

function handleDecreaseXInterval(state) {
  return state.setIn(["interval", "x"], state.interval.x / 2);
}

function handleToggleTriplet(state) {
  const { triplet, interval } = state;
  const nextInterval = triplet ? interval.x / 1.5 : interval.x * 1.5;

  return state.set("triplet", !triplet).setIn(["interval", "x"], nextInterval);
}

function handleCopyPath(state) {
  const { paths, pathIdx, zoom } = state;
  const path = paths[pathIdx].asMutable({ deep: true });
  const normalizedPath = path.map(point => {
    point.x /= zoom.x;
    return point;
  });

  return state.setIn(["clipboard", "path"], normalizedPath);
}

function handlePastePath(state) {
  const { pathIdx, clipboard, zoom } = state;
  const path = clipboard.path.asMutable({ deep: true });
  const normalizedPath = path.map(point => {
    point.x *= zoom.x;
    return point;
  });

  return state.setIn(["paths", pathIdx], normalizedPath).setIn(["clipboard", "path"], null);
}

function handleIncreaseBars(state) {
  const { bars, zoom } = state;
  const paths = state.paths.asMutable({ deep: true });
  const nextBars = bars + 1;
  const nextWidth = utils.getWidth({ bars: nextBars, zoom });

  if (bars === MAX_BARS) return state;

  const nextPaths = _.map(paths, path => {
    if (!path.length) return path;
    // Accommodate path inversion
    const lastPointY = path[path.length - 1].y;

    // If there are no midpoints, just extend without adding any new points
    if (path.length === 2) return path.concat([_.extend(path.pop(), { x: nextWidth })]);

    // Add a new endpoint
    return path.concat([{ x: nextWidth, y: lastPointY, id: _.uniqueId(SESSION_ID) }]);
  });

  return state
    .setIn(["clipboard", "path"], null)
    .setIn(["paths"], nextPaths)
    .set("bars", nextBars);
}

function handleDecreaseBars(state) {
  const { bars, zoom } = state;
  const paths = state.paths.asMutable({ deep: true });
  const nextBars = bars - 1;
  const nextWidth = utils.getWidth({ bars: nextBars, zoom });

  if (bars === MIN_BARS) return state;

  const nextPaths = _.map(paths, path => {
    if (!path.length) return path;
    // Filter out points that are out of bounds
    let nextPath = path.filter(point => point.x <= nextWidth);
    // Accommodate path inversion
    const lastPointY = path[path.length - 1].y;

    // Calculate index
    const lastIndex = nextPath.length - 1;
    let lastValidIndex = lastIndex;
    while (nextPath[lastValidIndex].isControl || nextPath[lastValidIndex].hidden) {
      lastValidIndex--;
    }

    // Ensure the path doesn't end with a fragmented curve
    if (lastValidIndex !== lastIndex) nextPath = path.filter((point, i) => i <= lastValidIndex);

    // Add a new endpoint
    return nextPath.concat([{ x: nextWidth, y: lastPointY, id: _.uniqueId(SESSION_ID) }]);
  });

  return state
    .setIn(["clipboard", "path"], null)
    .set("paths", nextPaths)
    .set("bars", nextBars);
}

function handleZoomIn(state) {
  const paths = state.paths.asMutable({ deep: true });
  const prevZoom = state.zoom.x;
  const nextZoom = state.zoom.x + ZOOM_FACTOR;
  const nextPaths = _.map(paths, path => {
    if (!path.length) return path;
    return path.map(point => {
      point.x = (point.x / prevZoom) * nextZoom;
      return point;
    });
  });

  return state.setIn(["zoom", "x"], nextZoom).set("paths", nextPaths);
}

function handleZoomOut(state) {
  const paths = state.paths.asMutable({ deep: true });
  const prevZoom = state.zoom.x;
  const nextZoom = state.zoom.x - ZOOM_FACTOR;

  if (nextZoom <= ZOOM_FACTOR) return state;

  const nextPaths = _.map(paths, path => {
    if (!path.length) return path;
    return path.map(point =>
      _.extend(point, {
        x: (point.x / prevZoom) * nextZoom
      })
    );
  });

  return state.setIn(["zoom", "x"], nextZoom).set("paths", nextPaths);
}

function handleBootstrap(state, payload) {
  return state.merge(payload);
}

function handleUpdateSettings(state, payload) {
  // for each envelope
  // if channel is now pitch and wasn't then set origin at height/2
  // if channel was pitch and is now not then set origin to height
  const prevMidi = state.settings.midi;
  const nextMidi = payload.midi;
  const paths = Immutable.asMutable(state.paths, { deep: true });

  _.each(paths, (path, i) => {
    if (prevMidi[i].channel !== PITCH && nextMidi[i].channel === PITCH && path.length >= 2) {
      // Moved to pitch
      initPath(path, state, true);
    } else if (prevMidi[i].channel === PITCH && nextMidi[i].channel !== PITCH && path.length >= 2) {
      // Moved from pitch
      initPath(path, state);
    }
  });

  return state.merge({
    settings: payload,
    paths
  });
}

function setBezier(points, state, options = {}) {
  switch (points.length) {
    case 3:
      return quadratic.setBezier(points, state, options);
    case 4:
      return cubic.setBezier(points, state, options);
    default:
      return state;
  }
}

function initPath(path, state, bipolar = false) {
  const height = utils.getHeight(state);
  const width = utils.getWidth(state);
  const initialY = bipolar ? height / 2 : height;

  // Clear array reference
  path.length = 0;

  path.push({ x: 0, y: initialY, id: _.uniqueId(SESSION_ID) }, { x: width, y: initialY, id: _.uniqueId(SESSION_ID) });
}
