require("dotenv").config();

const Discord = require("discord.js");
const fs = require("fs");

const ora = require("ora");
const log = require("./logger.js");
const config = require("../config.js")();
const chalk = require("chalk");

log.info('正在啓動機器人客戶端');

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES
  ],
  allowedMentions: {
    parse: ["users"],
    repliedUser: false
  }
});

client.commands = new Discord.Collection();
client.config = require("../config.js")
client.logger = log;

let commandFiles = fs.readdirSync(`./src/commands/`).filter(file => file.endsWith(".js"));
for (let cmd of commandFiles) {
  let command = require(`./commands/${cmd}`);
  client.commands.set(command.data.name, command);
}

// Read events
const events = fs
  .readdirSync("./src/events")
  .filter((file) => file.endsWith(".js"));

events.forEach((event) => {
  const eventFile = require(`./events/${event}`);
  if (eventFile.oneTime) {
    client.once(eventFile.event, (...args) => eventFile.run(...args,client));
  } else {
    client.on(eventFile.event, (...args) => eventFile.run(...args,client));
  }
});

client.login(config.token);

/**
 * HTTP
 */
if (config.enableApi) {
  let routeFiles = fs.readdirSync('./routes').filter(file => file.endsWith('.js'));
  for (let file of routeFiles) {
    let route = require(`./src/routes/${file}`);
    route(http);
  }
  http.listen(config.apiPort);
}