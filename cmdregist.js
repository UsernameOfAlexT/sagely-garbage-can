'use strict';
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const {GUILD_ID, CLIENT_ID, BOT_TOKEN} = process.env;

const registerCmds = async (commands) => {
  const commandData = commands.map((command) => {
    console.log(`Will register command: ${command.data.name}`)
    return command.data.toJSON();
  });
  const apiRoute = (GUILD_ID) ?
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID) :
    Routes.applicationCommands(CLIENT_ID);
  console.log(`${(GUILD_ID) ? "GUILD" : "GLOBAL"} UPDATE WILL PUT: ${apiRoute}`);
  const rest = new REST({ version: '9' }).setToken(BOT_TOKEN);
  return rest.put(apiRoute, {body: commandData});
};

module.exports = exports = {registerCmds};
