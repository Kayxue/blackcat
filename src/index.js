require("dotenv").config();

const Discord = require("discord.js");
const fs = require("fs");

const log = require("./logger.js");
const config = require("../config.js")();

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES
  ],
  allowedMentions: {
    parse: ["users"],
    repliedUser: false
  },
  shards: "auto"
});

client.commands = new Discord.Collection();
client.players = new Discord.Collection();
client.config = config;
client.logger = log;

let commandFiles = fs.readdirSync("./src/commands/").filter(file => file.endsWith(".js"));
for (let cmd of commandFiles) {
  let command = require(`./commands/${cmd}`);
  client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync("./src/events").filter((file) => file.endsWith(".js"));
for (let event of eventFiles) {
  const eventFile = require(`./events/${event}`);
  if (eventFile.once) {
    client.once(eventFile.event, (...args) => eventFile.run(client, ...args));
  } else {
    client.on(eventFile.event, (...args) => eventFile.run(client, ...args));
  }
}

client.on("ready", () => {
  log.info(`${client.user.username} 已上線`);
});

client.on("shardReady", (id) => {
  log.info(`分片 ${id} 已上線`);
});


client.login(config.token);
