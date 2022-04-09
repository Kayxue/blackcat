import dotenv from "dotenv";
dotenv.config();

import Discord from "discord.js";
import play from "play-dl";
import fs from "node:fs";

import log from "./logger.js";
import configReslover from "./util/configReslover.js";

const config = await configReslover();
const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES,
  ],
  allowedMentions: {
    parse: ["users"],
    repliedUser: false,
  },
  presence: {
    status: "idle",
    activities: [
      {
        name: "載入中... 請稍等",
        type: "COMPETING",
      },
    ],
  },
});

client.commands = new Discord.Collection();
client.players = new Discord.Collection();
client.config = config;
client.logger = log;

let commandFiles = fs
  .readdirSync("./src/commands/")
  .filter((file) => file.endsWith(".js"));
commandFiles.forEach(async (cmd) => {
  let command = (await import(`./commands/${cmd}`)).default;
  client.commands.set(command.data.name, command);
});

const eventFiles = fs
  .readdirSync("./src/events")
  .filter((file) => file.endsWith(".js"));
eventFiles.forEach(async (event) => {
  const eventFile = (await import(`./events/${event}`)).default;
  if (eventFile.once) {
    client.once(eventFile.event, (...args) =>
      eventFile.run(client, ...args),
    );
  } else {
    client.on(eventFile.event, (...args) =>
      eventFile.run(client, ...args),
    );
  }
});

client.login(config.token);

process.on("message", (message) => {
  if (message.type === "shardId") {
    client.shardId = message.value;
    log.info(`分片已接收到ID ${message.value}`);
  }
});

if (config.cookie) {
  play.setToken({
    youtube: {
      cookie: config.cookie
    }
  })
}
