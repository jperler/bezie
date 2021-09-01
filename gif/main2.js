const gm = require("gm");
const json = require("./3.json");
const fs = require("fs");

const instance = gm();
const fn = data => `${data.filename}.${data.ext}`;

var parse = data => data.replace(/^data:image\/octet\-stream;base64,/, "");

json.map(data => {
  // instance.in(data.imageData);
  fs.writeFileSync(fn(data), parse(data.imageData), "base64");
});

json.map(data => {
  instance.in(fn(data));
});

instance.delay(5).write("bezie.gif", function(err) {
  if (err) throw err;
  console.log("bezie.gif created");
});
