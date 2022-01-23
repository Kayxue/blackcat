require("dotenv").config();

const Discord = require("discord.js");
const log = require("loglevel");
const fs = require("fs");

const config = require("../config.js")();

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGES
  ],
  allowedMentions: {
    parse: ["users"],
    repliedUser: false
  }
});
client.login(config.token);

client.commands = new Discord.Collection();
client.players = new Discord.Collection();
client.logger = require("./logger.js");

let commandFiles = fs.readdirSync(`./commands/`).filter(file => file.endsWith(".js"));
for (let command of commandFiles) {
  let command = require(`./src/commands/${file}`);
  client.commands.set(command.name, command);
}

client.on("ready", () => {
  log.info(`${client.user.username} 已上線`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.author.id !== "669194742218752070") return;
  
  if (!message.content.startsWith("b!!")) return;
  let args = messgae.content.split(" ");
  let command = client.commands.get(args[0]);
  if (!command) return;
  
  args.shift();
  command.run(message, args);
});


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