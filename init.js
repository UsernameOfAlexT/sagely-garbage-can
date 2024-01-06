'use strict';
// simple startup script to ensure things are set when they are needed
const start = Date.now();
require('./envutils.js').setup(); // must be called before requiring anything
const fs = require('fs');
const {FORCE_CMD_UPDATE} = process.env;
const {registerCmds} = require('./cmdregist.js');
const {initialize} = require('./app.js');

const readCommandsFromFile = () => {
  const commandFiles = fs.readdirSync('./command').filter(
    (file) => file.endsWith('.js')
  );
  const commands = commandFiles.map((fileName) => {
    const path = `./command/${fileName}`;
    const command = require(path);
    console.log(`Detected command: ${command.data.name} at ${path}`)
    return command;
  });
  return commands;
};

const startup = async () => {
  // TODO cmd registration only if required i.e. a command's signature changes
  const commands = readCommandsFromFile();
  if (FORCE_CMD_UPDATE) await registerCmds(commands);
  await initialize(commands);
  console.log(`Initialized in ${Date.now() - start} ms`);
};

startup();

