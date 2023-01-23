import dotenv from "dotenv";

import Discord from "discord.js";
import { ClusterClient, getInfo } from "discord-hybrid-sharding";
import fs from "node:fs";

import log from "./logger.js";
import configReslover from "./util/configReslover.js";
dotenv.config();

const config = await configReslover();
const client = new Discord.Client({
  intents: [
    Discord.IntentsBitField.Flags.Guilds,
    Discord.IntentsBitField.Flags.GuildVoiceStates,
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
  shards: getInfo().SHARD_LIST,
  shardCount: getInfo().TOTAL_SHARDS,
});
client.cluster = new ClusterClient(client);

client.commands = new Discord.Collection();
client.players = new Map();
client.config = config;
client.logger = log;

if (config.enableDev) {
  client.on("debug", log.debug);
}

const commandFiles = fs
  .readdirSync("./src/commands/")
  .filter((file) => file.endsWith(".js"));
commandFiles.forEach(async (cmd) => {
  const command = (await import(`./commands/${cmd}`)).default;
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
