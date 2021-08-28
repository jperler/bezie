/* global d3 */
import _ from "lodash";
import { VIRTUAL_PORT_NAME, WIN_MIDI_ERROR, CONTROL_MAX, PITCH_MAX } from "../constants";

import { PITCH } from "../constants/midi";

const pitchScale = d3.scale
  .linear()
  .domain([0, CONTROL_MAX])
  .range([0, PITCH_MAX]);

class Midi {
  constructor() {}

  connectVirtualPorts() {}

  getControllers() {
    return [];
  }

  getControllerName(i) {}

  findController(data) {
    return _.find(this.getControllers(), data);
  }

  initControllers() {
    // Open all controllers
    _.each(this.getControllers(), controller => {
      // Only add it if it doesn't yet exist
      if (!this.controllers[controller.label]) {
      }
    });
  }

  setController(index) {
    // Remove current controllers events
    if (this.controller) this.controller.removeAllListeners("message");

    // Unset current controller
    if (_.isNull(index)) {
      this.controller = null;
      return;
    }

    // Set new controller
    const name = this.getControllerName(index);
    this.controller = this.controllers[name];
  }

  isConnected() {
    return this._isConnected;
  }

  hasController() {
    return !!this.controller;
  }

  getChannelName(n) {
    return n === PITCH ? "Pitch" : `Channel ${n}`;
  }

  getScaledPitch = _.memoize(n => _.round(pitchScale(n)));
  normalizePitch = n => this.getScaledPitch(n) - (PITCH_MAX + 1) / 2;
  getPitchValue = _.memoize(n => {
    const scaled = this.getScaledPitch(n);
    return [scaled & 0x7f, scaled >> 7];
  });
}

module.exports = new Midi();
