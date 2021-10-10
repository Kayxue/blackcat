const ytdl = require("ytdl-core");
const YouTube = require("youtube-sr").default;
const Player = require("../include/player");
const { MessageEmbed, Util, MessageButton, MessageActionRow } = require("discord.js");

module.exports = {
  name: "play",
  cooldown: 3,
  aliases: ["p"],
  description: "播放 Youtube 的歌曲",
  async execute(message, args) {
    const { channel } = message.member.voice;

    const serverQueue = message.client.players.get(message.guild.id);
    if (!channel) {
      return message.reply("❌ ┃ 你要先加入一個語音頻道...不然我要在哪的房間放收音機呢？")
        .catch(console.error);
    }
    if (serverQueue && channel !== message.guild.me.voice.channel) {
      return message.reply("❌ ┃ 你必須跟我在同一個頻道裡面!")
        .catch(console.error);
    }

    if (!args.length) {
      return message.reply("❌ ┃ 請輸入歌曲名稱或網址")
        .catch(console.error);
    }

    if (!channel.joinable) {
      return message.reply("❌ ┃ 無法連接到語音頻道!因為我沒有權限加入你在的房間!")
        .catch(console.error);
    }
    if (!channel.speakable && channel.type === "GUILD_VOICE") {
      return message.reply("❌ ┃ 我沒辦法在你的語音頻道裡放收音機!因為我沒有說話的權限!")
        .catch(console.error);
    }

    message.reply("<:music_search:827735016254734346> ┃ 搜尋中...\n> `" + args.join(" ") + "`")
      .catch(console.error);

    const search = args.join(" ");
    const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
    const url = args[0];
    const urlValid = ytdl.validateURL(url);

    if (!urlValid && playlistPattern.test(args[0])) {
      return message.client.commands.get("playlist").execute(message, args);
    }

    let songInfo = null;
    let song = null;
    let songs = [];

    if (urlValid) {
      try {
        songInfo = await ytdl.getInfo(url);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds,
          thumbnail: songInfo.videoDetails.thumbnails.pop().url,
          type: "song",
          by: message.user.username,
          info: songInfo
        };
      } catch (error) {
        console.error(error);
        message.client.log(error.message, "error");
        let errorMsg = null;
        if (error.message.includes("404") || error.message.includes("id")) {
          errorMsg = "❌ ┃ 找不到影片";
        } else if (error.message.includes("private") || error.message.includes("403")) {
          errorMsg = "❌ ┃ 無法播放私人影片";
        } else if (error.message.includes("429")) {
          message.followUp("❌ ┃ 發生Youtube API錯誤").catch(console.error);

          if (process.env.HEROKU_API_KEY && process.env.HEROKU_APP_ID) {
            await message.followUp("❌ ┃ 重新啟動中...");
            require("heroku-restarter")(process.env["HEROKU_API_KEY"], process.env["HEROKU_APP_ID"]).restart();
          }
        } else {
          errorMsg = "❌ ┃ 發生了未知的錯誤，此錯誤已被紀錄";
        }
        return message.followUp(errorMsg).catch(console.error);
      }
    } else {
      try {
        const results = await YouTube.search(search, {
          safeSearch: true
        });
        songInfo = await ytdl.getInfo(`https://youtu.be/${results[0].id}`);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds,
          thumbnail: songInfo.videoDetails.thumbnails.pop().url,
          type: "song",
          by: message.user.username,
          info: songInfo
        };
      } catch (error) {
        console.error(error);
        message.client.log(error.message, "error");
        let errorMsg = null;
        if (error.message.includes("404") || error.message.includes("id")) {
          errorMsg = "❌ ┃ 找不到影片";
        } else if (error.message.includes("private") || error.message.includes("403")) {
          errorMsg = "❌ ┃ 無法播放私人影片";
        } else if (error.message.includes("429")) {
          message.followUp("❌ ┃ 發生Youtube API錯誤").catch(console.error);

          if (process.env.HEROKU_API_KEY && process.env.HEROKU_APP_ID) {
            await message.followUp("❌ ┃ 重新啟動中...");
            require("heroku-restarter")(process.env["HEROKU_API_KEY"], process.env["HEROKU_APP_ID"]).restart();
          }
        } else {
          errorMsg = "❌ ┃ 發生了未知的錯誤，此錯誤已被紀錄";
        }
        return message.followUp(errorMsg).catch(console.error);
      }
    }

    songs.push(song);

    if (serverQueue) {
      serverQueue.add(songs);
      const embed = new MessageEmbed()
        .setColor("BLURPLE")
        .setTitle(`<:music_add:827734890924867585> ┃ 我已經把${song.title}加入播放清單了!`)
        .setThumbnail(song.thumbnail);

      return message.followUp({
        embeds: [embed]
      }).catch(console.error);
    }

    try {
      let player = new Player(channel, message.channel, message.client);
      message.client.players.set(message.guild.id, player);
      player.add(songs);
      message.followUp(`<:joinvc:866176795471511593> ┃ 已加入\`${Util.escapeMarkdown(channel.name)}\`並將訊息發送至<#${message.channel.id}>`)
        .catch(console.error);
      player.start()
        .catch(() => {
          return message.followUp("❌ ┃ 無法開始舞台頻道!\n黑貓必須為該舞台頻道的管理員!");
        });
    } catch (error) {
      console.error(error);
      message.client.players.delete(message.guild.id);
      return message.followUp(`❌ ┃ 無法加入語音頻道...原因: ${error.message}`)
        .catch(console.error);
    }
  }
};
