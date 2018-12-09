let interval;

self.addEventListener(
  "message",
  e => {
    switch (e.data.action) {
      case "set":
        return set(e.data);
      case "clear":
        return clear(e.data);
      default:
        return;
    }
  },
  false
);

function set({ timeout }) {
  interval = setInterval(() => {
    self.postMessage("tick");
  }, timeout);
}

function clear() {
  clearInterval(interval);
}
