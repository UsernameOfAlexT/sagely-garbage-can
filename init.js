'use strict';
const start = Date.now();
// simple startup script to ensure things are set when they are needed
require('./envutils.js').setup();
// TODO cmd registration only if required i.e. a command's signature changes
require('./cmdregist.js').registerCmds().then(() => {
  console.log(`Initialization finished in ${Date.now() - start} ms`);
  require('./app.js');
});
