'use strict';
const {Client, Intents, Collection, Permissions} = require('discord.js');
const {InteractionReply} = require('./support/intereply.js');
const {BOT_TOKEN} = process.env;
const utils = require('./utils.js');
const phraserobj = require('./datalists/statusphraseobjs.js');
const phraser = require('./datalists/statusphraser.js');
const {useDetailedLogging} = require('./envutils.js');

const intentsUsed = new Intents();
intentsUsed.add(
  Intents.FLAGS.GUILD_VOICE_STATES,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.DIRECT_MESSAGES,
  Intents.FLAGS.GUILDS
);

const client = new Client({ intents: intentsUsed });
const cooldowns = new Collection();
let voiceStateLastUpdate = Date.now(); // TODO move this
const VOICE_MIN_CD = 5000; // 5 seconds min between updates

exports.initialize = (commands) => {
  client.commands = new Collection();
  for (const command of commands) 
    client.commands.set(command.data.name, command);
  return client.login(BOT_TOKEN);
};

client.once('ready', () => {
  console.log(`Logging Level: ${useDetailedLogging() ? "debug" : "standard"}`);
  console.log('I am ready to fight robots');

  // roll a random status upon each startup. For fun.
  const randactivity = phraserobj.chain(phraser.standard_list, 4);
  client.user.setActivity(randactivity, { type: utils.pickRandomly(phraser.relevant_start_statuses) });
});

client.on('interactionCreate', interaction => {
  // check if it's a command
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;
  const command = client.commands.get(commandName)

  // most cmds expect a calling channel for the interaction, so guard against that
  if (!interaction.channel) {
    return new InteractionReply(interaction)
      .withReplyContent("Commands can\'t be executed from this channel right now")
      .replyTo();
  }

  // guard dm interactions if not allowed
  // interactions without channels are usually due to uncached dm channels
  const invokedFromDm = interaction.channel.type === 'DM';
  if (command.disallowDm && invokedFromDm) {
    return utils.safeReply(interaction, `${commandName}, you can\'t use that here`);
  }

  // permissions checks (note: interaction replies don't need send permissions)
  if (command.needSendPerm && !invokedFromDm
    && !(interaction.channel.permissionsFor(client.user).has(Permissions.FLAGS.SEND_MESSAGES))) {
    utils.safeReply(interaction, 'I need permission to send messages to do that here');
    const msgToBuild = [];
    msgToBuild.push(`I tried to execute ${commandName}`);
    msgToBuild.push(`But I have no permission to do that there.`);
    return interaction.user.send(msgToBuild.join('\n'))
      .catch(err => {
        console.error(`${interaction.user.id} failed to DM with permission warning. \n`, err);
      });
  }

  // Owner only checking
  if (command.ownerOnly && !(interaction.user.id === interaction.guild.ownerId)) {
    return utils.safeReply(interaction, `${commandName}\'s power can be used only by the server owner`)
  }

  // checking cooldowns to prevent spam
  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const cdTime = (command.cd || 3) * 1000;

  // get the actual time the cd expires and respond if not yet time
  if (timestamps.has(interaction.user.id)) {
    const expireTime = timestamps.get(interaction.user.id) + cdTime;

    if (now < expireTime) {
      const left = (expireTime - now) / 1000;
      return utils.safeReply(interaction, `\'${command.data.name}\' cannot be used again just yet. Wait ${left.toFixed(1)} more second(s)`);
    }
  }
  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cdTime);

  try {
    command.execute(interaction);
  } catch (error) {
    console.error(error);
    utils.safeReply(interaction, `${commandName} failed. Something went wrong. Contact Dev and yell at them to fix this`);
  }
});

// Sometimes change activity on some voice state changes. Also for fun.
client.on('voiceStateUpdate', (oldState, newState) => {
  // Prevent changing too frequently
  const now = Date.now();

  // if this isn't set for some reason, then assume it does not apply
  if (voiceStateLastUpdate) {
    const expireTime = voiceStateLastUpdate + VOICE_MIN_CD;
    // don't do this every possible time
    if (now < expireTime || utils.withChance(75)) {
      return;
    }
  }
  voiceStateLastUpdate = now;
  const subject = newState.member.displayName ? newState.member.displayName : "Someone";
  // Replace the placeholder string
  const formattedact = phraserobj.chain(phraser.user_act_list, 3)
    .replaceAll(phraser.named_placeholder, subject);
  client.user.setActivity(formattedact, { type: utils.pickRandomly(phraser.relevant_start_statuses) });
});

