const YouTube = require("youtube-sr").default;
const Player = require("../include/player");
const { MessageEmbed, Permissions, Util } = require("discord.js");

module.exports = {
  name: "playlist",
  cooldown: 3,
  aliases: ["pl"],
  description: "播放Youtube的播放清單",
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

    const search = args.join(" ");
    const pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
    const url = args[0];
    const urlValid = pattern.test(args[0]);

    let song = null;
    let playlist = null;
    let videos = [];

    let playlistEmbed = new MessageEmbed()
      .setTitle("正在讀取播放清單, 請稍等...")
      .setColor("BLURPLE");

    await message.reply({
      embeds: [playlistEmbed]
    }).catch(console.error);

    if (urlValid) {
      try {
        playlist = await YouTube.getPlaylist(url);
        videos = await playlist.fetch();
      } catch (error) {
        console.error(error);
        return message.editReply({
          content: "❌ ┃ 沒有找到播放清單",
          embeds: []
        })
          .catch(console.error);
      }
    } else {
      try {
        const results = await YouTube.search(search, {
          safeSearch: true,
          type: "playlist"
        });
        playlist = await YouTube.getPlaylist(results[0].url);
        videos = await playlist.fetch();
      } catch (error) {
        console.error(error);
        return message.editReply({
          content: "❌ ┃ 沒有找到播放清單",
          embeds: []
        })
          .catch(console.error);
      }
    }
    
    let songList = [];

    videos.videos.forEach((video) => {
      song = {
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        duration: video.duration / 1000,
        thumbnail: video.thumbnail.url,
        type: "playlist_song",
        by: message.user.username,
        id: video.id
      };
      songList.push(song);
    });

    playlistEmbed
      .setTitle(`${playlist.title}`)
      .setURL(playlist.url)
      .setDescription(`\n<:music_add:827734890924867585> ┃ 已新增${playlist.videoCount}首歌`)
      .setColor("BLURPLE")
      .setThumbnail(playlist.thumbnail.url);
    message.editReply({
      embeds: [playlistEmbed]
    }).catch(console.error);

    if (!serverQueue) {
      try {
        let player = new Player(channel, message.channel, message.client);
        message.client.players.set(message.guild.id, player);
        player.add(songList);
        message.followUp(`<:joinvc:866176795471511593> ┃ 已加入\`${Util.escapeMarkdown(channel.name)}\`並將訊息發送至<#${message.channel.id}>`)
          .catch(console.error);
        player.start()
          .catch(() => {
            return message.followUp("❌ ┃ 無法開始舞台頻道!\n黑貓必須為該舞台頻道的管理員!");
          });
      } catch (error) {
        console.error(error);
        message.client.players.delete(message.guild.id);
        await channel.leave();
        return message.followUp(`❌ ┃ 無法加入語音頻道...原因: ${error.message}`)
          .catch(console.error);
      }
    } else {
      serverQueue.add(songList);
    }
  }
};