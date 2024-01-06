'use strict';
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const fs = require('fs');
const {GUILD_ID, CLIENT_ID, BOT_TOKEN} = process.env;

// TODO very similar to in app.js, consider making common
const readCommandsFromFile = () => {
  const commands = [];
  const commandFiles = fs.readdirSync('./command').filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./command/${file}`);
    commands.push(command.data.toJSON());
    console.log(`Detected command: ${command.data.name}`)
  }
  return commands;
};

const registerCmds = async () => {
  const apiRoute = (GUILD_ID) ?
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID) :
    Routes.applicationCommands(CLIENT_ID);
  console.log(`${(GUILD_ID) ? "GUILD" : "GLOBAL"} UPDATE WILL PUT: ${apiRoute}`);
  const rest = new REST({ version: '9' }).setToken(BOT_TOKEN);
  return rest.put(apiRoute, {body: readCommandsFromFile()});
};

module.exports = exports = {registerCmds};
