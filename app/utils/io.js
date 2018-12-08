import fs from "fs";

const INVALID_FILE_MESSAGE = "Oops! This file is invalid.";

export function save(sender, filename, { paths, zoom, bars, settings }) {
  fs.writeFileSync(filename, JSON.stringify({ paths, zoom, bars, settings }));
}

export function open(sender, filename, { bootstrap }) {
  fs.readFile(filename, (error, json) => {
    let data;

    try {
      data = JSON.parse(json);
    } catch (e) {
      alert(INVALID_FILE_MESSAGE); // eslint-disable-line
    }

    if (data) bootstrap(data);
  });
}
