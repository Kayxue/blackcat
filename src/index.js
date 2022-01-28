require("dotenv").config();

const Discord = require("discord.js");
const fs = require("fs");

const log = require("./logger.js");
const allowModify = require("./util/allowModify.js");
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
client.logger = log;

let commandFiles = fs.readdirSync("./src/commands/").filter(file => file.endsWith(".js"));
for (let cmd of commandFiles) {
  let command = require(`./commands/${cmd}`);
  client.commands.set(command.name, command);
}

client.on("ready", () => {
  log.info(`${client.user.username} 已上線`);
});

client.on("shardReady", (id) => {
  log.info(`分片 ${id} 已上線`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (!message.guild) return message.channel.send("❌ 你必須把我加到一個伺服器裡!");
  if (!message.channel) return message.channel.send("❌ 無法取得頻道!");
  if (message.author.id !== "669194742218752070") return message.channel.send("❌ 你不是測試人員!");
  
  if (!message.content.startsWith(config.prefix)) return;
  message.content.slice(config.prefix.length).trim().split(" ");
  let command = 
    client.commands.get(args[0].replace(config.prefix, "")) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(args[0].replace(config.prefix, "")));
  if (!command) return;

  message.allowModify = allowModify(message.member);
  
  args.shift();
  command.run(message, args);
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