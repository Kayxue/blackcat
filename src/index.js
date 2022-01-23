require("dotenv").config();

const Discord = require("discord.js");
const log = require("loglevel");
const fs = require("fs");

const config = require("../config.js")();

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES
  ],
  allowedMentions: {
    parse: ["users"],
    repliedUser: false
  }
});

client.commands = new Discord.Collection();
client.players = new Discord.Collection();
client.logger = require("./logger.js");

let commandFiles = fs.readdirSync(`./src/commands/`).filter(file => file.endsWith(".js"));
for (let cmd of commandFiles) {
  let command = require(`./commands/${cmd}`);
  client.commands.set(command.name, command);
}

client.on("ready", () => {
  log.info(`${client.user.username} 已上線`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.author.id !== "669194742218752070") return;
  
  if (!message.content.startsWith("b!!")) return;
  let args = message.content.split(" ");
  let command = client.commands.get(args[0].replace("b!!", ""));
  if (!command) return;
  
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