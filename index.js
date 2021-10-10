require("dotenv").config();
global.fetch = require("node-fetch");

const
  Discord = require("discord.js"),
  mongo = require("quickmongo"),
  fetch = require("node-fetch"),
  express = require("express"),
  lyricsFinder = require("lyrics-finder"),
  ws = require("express-ws"),
  crypto = require("crypto"),
  helmet = require("helmet"),
  io = require("@pm2/io"),
  SoundCloud = require("soundcloud-scraper"),
  RateLimit = require("express-rate-limit"),
  { readdirSync, readFileSync } = require("fs"),
  { DiscordTogether } = require("discord-together"),
  { join } = require("path");

const PREFIX = process.env.PREFIX;
let bootStart = Date.now();

const client = new Discord.Client({
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: true
  },
  intents: [
    "GUILDS",
    "GUILD_MEMBERS",
    "GUILD_BANS",
    "GUILD_INTEGRATIONS",
    "GUILD_WEBHOOKS",
    "GUILD_INVITES",
    "GUILD_VOICE_STATES",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS"
  ],
  presence: {
    status: "idle",
    afk: true,
    activities: [{
      name: "🔁 正在準備",
      type: "COMPETING"
    }]
  },
  userAgentSuffix: [
    "BlackCat/14.0.0 (https://blackcatbot.tk/)",
    "DiscordJS/13.1.0 (https://discord.js.org)"
  ]
});
client.login(process.env.TOKEN);
client.together = new DiscordTogether(client);
client.db = new mongo.Database(process.env.MONGO_DB_URL, "blackcat");
client.commands = new Discord.Collection();
client.locales = new Discord.Collection();
client.players = new Map();
client.streamCache = new Map();
client.log = async function (msgContent, type) {
  const webhook = new Discord.WebhookClient({
    id: process.env.WEBHOOK_ID,
    token: process.env.WEBHOOK_SECRET
  });
  let content = `[Black cat] ${msgContent}`;
  switch (type) {
  case "warn":
    webhook.send(content, {
      username: "[Warn]",
      avatarURL: "https://blackcatbot.tk/assets/warn.png"
    });
    break;
  case "error":
    webhook.send(content, {
      username: "[Error]",
      avatarURL: "https://blackcatbot.tk/assets/error.png"
    });
    break;
  default:
    webhook.send(content, {
      username: "[Info]",
      avatarURL: "https://blackcatbot.tk/assets/info.png"
    });
    break;
  }
};
client.getLocale = function (locale) {
  let selectLocale = client.locales.get(locale);
  if (!selectLocale) return client.locales.get("zh_tw");
  return selectLocale;
};

const app = express();
const limiter = RateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: "Status code 429",
  onLimitReached: function (req) {
    client.log(`${req.headers["x-forwarded-for"]} has been rate-limited`, "warn");
  }
});
app.set("trust proxy", true);
ws(app);
app.use(helmet());
app.use(limiter);
app.use(express.json());

const cooldowns = new Discord.Collection();

SoundCloud.keygen()
  .then(key => {
    client.scKey = key;
    client.log(`Fetched SoundCloud key \`${key}\``);
  })
  .catch(console.error);

client.on("ready", async () => {
  console.log(`Logged as ${client.user.username}`);
  console.log(`Bot is in ${client.guilds.cache.size} server(s)`);
  client.log(`Black cat ready, boot took ${Date.now() - bootStart}ms`);
  client.log(`Using FFmpeg engine \`${require("prism-media").FFmpeg.getInfo().version}\``);
  client.user.setPresence({
    activities: [{
      name: `/help • 在${client.guilds.cache.size}個伺服器`,
      type: "LISTENING"
    }],
    status: "dnd"
  });
});

client.db.on("ready", () => {
  console.log("Connected to DB");
  client.log("connected to DB");
});

client.on("warn", (info) => console.log(info));
client.on("error", console.error);

let gcInterval = setInterval(() => {
  try {
    global.gc();
  } catch (e) {
    clearInterval(gcInterval);
    console.error("Some thing went wrong when starting garbage collector");
    console.error(e.message);
  }
}, 60000);

const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", file.toString()));
  client.commands.set(command.name, command);
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  if (!(message.content.startsWith(PREFIX) || message.content.startsWith(PREFIX.toUpperCase()))) return;

  let disabledEmbed = new Discord.MessageEmbed()
    .setTitle("❗ ┃ 一般指令已被移除")
    .setDescription(
      "一般指令已被移除，請改用斜線指令\n" +
      "請嘗試輸入`/`，如沒有出現黑貓的指令列表，請[重新邀請機器人](https://blackcatbot.tk/blackcat)或重新檢查權限")
    .setColor("BLURPLE");
  return message.channel.send({
    embeds: [disabledEmbed]
  });
});

client.on("voiceStateUpdate", (oldState) => {
  try {
    if (!oldState.channel) return;

    let player = client.players.get(oldState.guild.id);
    if (!player) return;

    setTimeout(() => {
      let voiceChannel = oldState.guild.me.voice.channel;
      if (!voiceChannel) return;
      let members = voiceChannel.members.filter(member => !member.user.bot);

      if (members.size <= 0) {
        player.textChannel.send("🎈 ┃ 語音頻道沒人了，音樂已自動停止");
        player.destroy();
      }
    }, 15000);
  } catch (e) {
    console.error(e);
  }
});

client.on("guildCreate", async guild => {
  client.user.setPresence({
    activities: [{
      name: `/help • 在${client.guilds.cache.size}個伺服器`,
      type: "LISTENING"
    }],
    status: "dnd"
  });
  if (!guild.systemChannel) return;
  const embed = new Discord.MessageEmbed()
    .setTitle("感謝邀請Black cat")
    .setDescription(
      "非常謝謝你邀請我進來這個伺服器!\n\n" +
      "[加入官方Discord伺服器](https://blackcatbot.tk/blackcat)\n" +
      "我們強烈建議您加入我們的Discord伺服器，以便接受通知\n\n" +
      "想要開始探索嗎?輸入`/help`吧!\n" +
      "發生問題?輸入`/support`!")
    .setColor("BLURPLE");
  guild.systemChannel.send(embed);
  client.log(`Joined ${Discord.Util.removeMentions(guild.name)}`);
});

client.on("guildDelete", guild => {
  client.user.setPresence({
    activities: [{
      name: `/help • 在${client.guilds.cache.size}個伺服器`,
      type: "LISTENING"
    }],
    status: "dnd"
  });
  client.log(`Leave ${Discord.Util.removeMentions(guild.name)}`);
  let existingPlayer = client.players.get(guild.id);
  if (existingPlayer) client.players.delete(guild.id);
});

client.on("interactionCreate", (interaction) => {
  if (!interaction.inGuild()) return interaction.reply("❌ ┃ 請在伺服器裡傳送指令!").catch(console.error);
  if (!interaction.guild) return interaction.reply("❌ ┃ 黑貓必須要在你的伺服器裡!").catch(console.error);

  if (interaction.isContextMenu()) {
    client.emit("menuInteraction", interaction);
  } else if (interaction.isCommand()) {
    if (!interaction.channel.permissionsFor(interaction.guild.me).has([
      Discord.Permissions.FLAGS.EMBED_LINKS,
      Discord.Permissions.FLAGS.SEND_MESSAGES
    ])) return interaction.reply("❌ ┃ 我沒有權限在此頻道發送訊息!").catch(console.error);

    client.emit("commandInteraction", interaction);
  } else if (interaction.isButton()) {
    client.emit("buttonInteraction");
  } else if (interaction.isSelectMenu()) {
    client.emit("selectInteraction");
  } else if (interaction.isMessageComponent()) {
    client.emit("componentInteraction");
  }
});

client.on("menuInteraction", interaction => {
  const { canModifyQueue } = require("./util/Util");

  let player = client.players.get(interaction.guild.id);
  if (!player) return interaction.reply({
    content: "❌ ┃ 目前沒有歌曲正在播放!",
    ephemeral: true
  });

  if (!canModifyQueue(interaction.member)) return interaction.reply({
    content: "❌ ┃ 你必須跟我在同一個頻道裡!",
    ephemeral: true
  });
  switch (interaction.commandName) {
  case "暫停音樂":
    if (!player.playing) return interaction.reply({
      content: "❌ ┃ 歌曲已經暫停了",
      ephemeral: true
    });
    player.pause();
    interaction.reply(`<:pause:827737900359745586> ┃ 歌曲被 **${Discord.Util.escapeMarkdown(interaction.user.username)}** 暫停了`).catch(console.error);
    break;
  case "繼續播放音樂":
    if (player.playing) return interaction.reply({
      content: "❌ ┃ 歌曲已經在播放了",
      ephemeral: true
    }).catch(console.error);
    player.resume();
    interaction.reply(`<:play:827734196243398668> ┃ **${Discord.Util.escapeMarkdown(interaction.user.username)}** 繼續播放目前的歌曲`).catch(console.error);
    break;
  case "跳過歌曲":
    player.skip();
    interaction.reply(`<:skip:827734282318905355> ┃ **${Discord.Util.escapeMarkdown(interaction.user.username)}** 跳過了這一首歌曲`).catch(console.error);
    break;
  default:
    interaction.reply({
      content: "❌ ┃ 未知的指令",
      ephemeral: true
    });
  }
});

client.on("commandInteraction", interaction => {
  const commandName = interaction.commandName.toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return interaction.reply({
    content: "❌ ┃ 找不到指令... 請稍待Discord同步指令列表",
    ephemeral: true
  });

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return interaction.reply({
        content: `🕒 請等待${Math.ceil(timeLeft.toFixed(1))}秒後再使用${command.name}指令!!!`,
        ephemeral: true
      });
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  let args = [];
  interaction.options.data.forEach(option => {
    args.push(option.value);
  });

  try {
    command.execute(interaction, args);
  } catch (error) {
    console.error(error);
    let embed = new Discord.MessageEmbed()
      .setTitle("❌ ┃ 執行時發生錯誤")
      .setDescription(`\`${error.message}\``)
      .setFooter("所有的錯誤都會自動回報給開發者");
    interaction.reply({
      embeds: [embed],
      ephemeral: true
    }).catch(console.error);
    client.log(`${error.message} (Command:${command.name})`, "error");
  }
});

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "static", "200.html"));
});

app.ws("/api/ws/playing", (ws) => {
  try {
    ws.on("message", msg => {
      let jsonData = null;
      try {
        jsonData = JSON.parse(msg);
      } catch (e) {
        return console.log(e);
      }
      if (!jsonData.server) {
        ws.send(JSON.stringify({ exist: false }));
        return ws.close();
      }
      const guild = client.guilds.cache.get(jsonData.server);
      if (!guild) {
        ws.send(JSON.stringify({ exist: false }));
        return ws.close();
      }
      const queue = client.players.get(guild.id);
      if (!queue) {
        return ws.send(JSON.stringify({ playing: false }));
      }
      const song = queue.current;
      if (!song) {
        return ws.send(JSON.stringify({ playing: false }));
      }
      try {
        ws.send(JSON.stringify({
          name: guild.name,
          title: song.title,
          url: song.url,
          thumbnail: song.thumbnail,
          now: queue.playTime,
          total: Number(song.duration),
          pause: queue.playing,
          playing: true,
          volume: queue.volume
        }));
      } catch {
        ws.send(JSON.stringify({ playing: false }));
      }
    });
  } catch (e) {
    console.log(e);
  }
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/api/status", function (req, res) {
  res.send("online");
});

app.get("/api/exist", async function (req, res) {
  if (!req.query.server) return res.send({ exist: false });
  let guild = client.guilds.cache.get(req.query.server);
  if (!guild) return res.send({ exist: false });
  res.send({ exist: true });
});

app.get("/api/lyrics", async function (req, res) {
  if (!req.query.title) return res.send({ error: true, code: 101 });
  let lyrics;
  try {
    lyrics = await lyricsFinder(req.query.title, "");
  } catch (error) {
    res.send({ error: true, code: 201 });
  }
  if (lyrics) return res.send({ lyrics });
  else return res.send({ error: true, code: 201 });
});

app.use((req, res, next) => {
  if (!req.query.token) next();
  else {
    try {
      let textParts = req.query.token.split(":");
      let iv = Buffer.from(textParts.shift(), "hex");
      let encryptedText = Buffer.from(textParts.join(":"), "hex");
      let decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(process.env.ENCODE_KEY), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      req.userToken = decrypted.toString();
      next();
    } catch {
      res.clearCookie("token");
      next();
    }
  }
});

app.use(require("cookie-parser")());

app.get("/api/auth/login", function (req, res) {
  if (!req.query.code) return res.status(302).send({ token: null });
  const data = {
    client_id: client.application.id,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: "https://app.blackcatbot.tk/callback/",
    code: req.query.code,
    scope: "identify guilds"
  };
  fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams(data),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
    .then(res => res.json())
    .then(json => {
      let text = `${json.token_type} ${json.access_token}`;
      let iv = crypto.randomBytes(16);
      let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(process.env.ENCODE_KEY), iv);
      let encrypted = cipher.update(text);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      let token = iv.toString("hex") + ":" + encrypted.toString("hex");
      res.status(200).json({
        token
      });
    })
    .catch(error => {
      console.log(error);
      res.status(500).send({ error: true, message: "發送請求到Discord伺服器時發生錯誤" });
    });
});

app.get("/api/auth/info", function (req, res) {
  if (!req.userToken) return res.status(400).send({ error: true, message: "沒有提供Token，請重新登入" });
  const token = req.userToken;
  fetch("https://discord.com/api/users/@me", {
    headers: {
      authorization: token
    }
  })
    .then(info => info.json())
    .then(json => res.send(json))
    .catch(error => {
      console.log(error);
      res.status(500).send({ error: true });
    });
});

async function checkModify(token, guildID) {
  return new Promise((reslove) => {
    fetch("https://discord.com/api/users/@me", {
      headers: {
        authorization: token
      }
    }).then(res => res.json()).then(async json => {
      const guild = await client.guilds.fetch(guildID).catch(() => { reslove(4); });
      const member = guild.members.cache.get(json.id);
      if (!member) reslove(1);
      else if (!member.voice.channel) reslove(2);
      else if (!member.voice.channel.members.get("848006097197334568")) reslove(3);
      else reslove(0);
    }).catch(() => reslove(1));
  });
}

app.get("/api/pause", async function (req, res) {
  if (!req.userToken || !req.query.guild) return res.send({ message: "發生錯誤，請重新整理頁面", red: true });
  const premission = await checkModify(req.userToken, req.query.guild);
  switch (premission) {
  case 1:
    return res.send({ message: "請先加入這個伺服器!", red: true });
  case 2:
    return res.send({ message: "請先加入一個語音頻道!", red: true });
  case 3:
    return res.send({ message: "請跟機器人在同一個頻道裡!", red: true });
  case 4:
    return res.send({ message: "沒有找到伺服器", red: true });
  case 5:
    return res.send({ error: true, code: 101 });
  }
  try {
    const queue = client.players.get(req.query.guild);
    if (!queue) return res.send({ error: true, code: 101 });
    if (queue.playing) {
      queue.playing = false;
      queue.pause();
      queue.textChannel.send("<:pause:827737900359745586> ┃ 歌曲已由網頁面板暫停").then(sent => {
        setTimeout(function () {
          sent.delete();
        }, 60000);
      }).catch(console.error);
      res.send({ message: "指令發送成功!", red: false });
    } else {
      res.send({ message: "歌曲已經暫停了", red: true });
    }
  } catch (e) {
    res.send({ message: e, red: true });
  }
});

app.get("/api/resume", async function (req, res) {
  if (!req.userToken || !req.query.guild) return res.send({ message: "發生錯誤，請重新整理頁面", red: true });
  const premission = await checkModify(req.userToken, req.query.guild);
  switch (premission) {
  case 1:
    return res.send({ message: "請先加入這個伺服器!", red: true });
  case 2:
    return res.send({ message: "請先加入一個語音頻道!", red: true });
  case 3:
    return res.send({ message: "請跟機器人在同一個頻道裡!", red: true });
  case 4:
    return res.send({ message: "沒有找到伺服器", red: true });
  case 5:
    return res.send({ error: true, code: 101 });
  }
  try {
    const queue = client.players.get(req.query.guild);
    if (!queue) return res.send({ error: true, code: 101 });
    if (!queue.playing) {
      queue.playing = true;
      queue.resume();
      queue.textChannel.send("<:play:827734196243398668> ┃ 由網頁面板繼續播放歌曲").then(sent => {
        setTimeout(function () {
          sent.delete();
        }, 60000);
      }).catch(console.error);
      res.send({ message: "指令發送成功!", red: false });
    } else {
      res.send({ message: "歌曲已經在播放了", red: true });
    }
  } catch (e) {
    res.send({ message: `發送指令時出現錯誤: ${e.message}`, red: true });
  }
});

app.get("/api/skip", async function (req, res) {
  if (!req.userToken || !req.query.guild) return res.send({ message: "發生錯誤，請重新整理頁面", red: true });
  const premission = await checkModify(req.userToken, req.query.guild);
  switch (premission) {
  case 1:
    return res.send({ message: "請先加入這個伺服器!", red: true });
  case 2:
    return res.send({ message: "請先加入一個語音頻道!", red: true });
  case 3:
    return res.send({ message: "請跟機器人在同一個頻道裡!", red: true });
  case 4:
    return res.send({ message: "沒有找到伺服器", red: true });
  case 5:
    return res.send({ error: true, code: 101 });
  }
  try {
    const queue = client.players.get(req.query.guild);
    if (!queue) return res.send({ error: true, code: 101 });
    queue.playing = true;
    queue.skip();
    queue.textChannel.send("<:next:766802340538875964> ┃ 由網頁面板跳過目前歌曲").then(sent => {
      setTimeout(function () {
        sent.delete();
      }, 60000);
    }).catch(console.error);
    res.send({ message: "指令發送成功!", red: false });
  } catch (e) {
    res.send({ message: e, red: true });
  }
});

app.use((req, res) => {
  res.status(404).sendFile(join(__dirname, "static", "404.html"));
});

app.use(io.expressErrorHandler());

app.listen(process.env.PORT || 8080);

process.on("uncaughtException", (error) => console.error(error));
process.on("unhandledRejection", (error) => console.error(error));

process.on("exit", (code) => {
  console.log(`Process exit with code: ${code}`);
});

process.on("SIGINT", () => {
  client.destroy();
  process.exit(0);
});
