const {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const Discord = require("discord.js");
const play = require("play-dl");
const log = require("../logger.js");
const colors = require("../color.json");

class Player {
  /**
   * @param {Discord.Message} event 
   * @param {Discord.Guild} guild 
   * @param {Discord.VoiceChannel} voice 
   */
  constructor(event, guild, voice) {
    this._client = event.client;
    this._channel = event.channel;
    this._guild = guild;
    this._guildId = guild.id;
    this._voiceChannel = voice;
    this._channelId = voice.id;

    this._init = false;
    this._noticeMessage = null;
    this._nowplaying = null;
    this._songs = [];
  }

  static getSendingPlayer(guild) {
    return guild.client.players.get(guild.id);
  }
  noop() {}

  init() {
    if (this._init) return;
    try {
        this._connection = joinVoiceChannel({
        guildId: this._guildId,
        channelId: this._channelId,
        adapterCreator: this._guild.voiceAdapterCreator
      });
    } catch (e) {
      log.error(e.message);
      let errorEmbed = new Discord.MessageEmbed()
        .setTitle("🙁 加入語音頻道時發生錯誤")
        .setDescription(
          "加入語音頻道時發生了一些錯誤...\n"+
          "錯誤內容:\n"+
          "```\n"+e.message+"\n```")
        .setColor(colors.danger);
      this._channel.send({
        embeds: [errorEmbed]
      });
      return;
    }
    this._player = createAudioPlayer();
    this._connection.subscribe(this._player);
    
    this._connection.on(VoiceConnectionStatus.Ready, () => {
      log.info(`${this._guildId}:${this._channelId} 已進入預備狀態`);
    });
    this._connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      log.warn(`${this._guildId}:${this._channelId} 語音斷開連結`);
      try {
        await Promise.race([
          entersState(this._connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this._connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        log.info(`${this._guildId}:${this._channelId} 重新連接成功`);
      } catch (error) {
        log.warn(`${this._guildId}:${this._channelId} 無法重新連線`);
        let disconnecteEmbed = new Discord.MessageEmbed()
          .setTitle("😕 我的語音連接斷開了")
          .setColor(colors.danger);
        this._channel.send({
          embeds: [disconnecteEmbed]
        })
          .catch(this.noop);
        this._connection.destroy();
      }
    });
    this._player.on(AudioPlayerStatus.Idle, () => {
      log.info(`${this._guildId}:${this._channelId} 音樂播放器進入閒置狀態`);
      this.handelIdle();
    });
    this._player.on(AudioPlayerStatus.Buffering, () => {
      log.info(`${this._guildId}:${this._channelId} 音樂播放器進入緩衝狀態`);
    });
    this._init = true;
    this._client.players.set(this._guildId, this);
  }
  
  /**
   * @param {String} track 
   */
  async play(track) {
    let rawData, parsedData, isPlaylist = false;
    if (play.yt_validate(track) !== "video" && !track.startsWith("https")) {
      try {
        let result = await play.search(track, {
          limit: 1
        });
        rawData = await play.video_info(result[0].url);
        if (!rawData) {
          return this._channel.send("Nothing found")
        }
        rawData.full = false;
      } catch (e) {
        this._channel.send(e.message);
        log.error(e.message);
      }
    } else if (play.yt_validate(track) === "video") {
      try {
        rawData = await play.video_info(track);
        rawData.full = true;
      } catch (e) {
        this._channel.send(e.message);
        log.error(e.message);
      }
    } else {
      let videos;
      isPlaylist = true;
      try {
        let playlist = await play.playlist_info(track);
        videos = await playlist.all_videos();
      } catch (e) {
        this._channel.send(e.message);
        log.error(e.message);
      }
      parsedData = [];
      videos.forEach((video) => {
        video.full = false;
        parsedData.push({
          title: video.title,
          url: video.url,
          duraction: video.duractionInSec,
          duractionParsed: video.duractionRaw,
          thumbnail: video.thumbnails.pop().url,
          rawData: video
        });
      })
    }
    if (!isPlaylist) parsedData = [{
      title: rawData.video_details.title,
      url: rawData.video_details.url,
      duraction: rawData.video_details.durationInSec,
      duractionParsed: rawData.video_details.durationRaw,
      thumbnail: rawData.video_details.thumbnails.pop().url,
      rawData
    }];

    if (this._songs.length === 0) {
      this._songs.push(...parsedData);
      this.playStream();
    } else {
      this._songs.push(...parsedData);
    }

    this._player.once(AudioPlayerStatus.Playing, () => {
      log.info(`${this._guildId}:${this._channelId} 音樂播放器進入播放狀態`);
      this.handelPlaying();
    });
  }

  skip() {
    this._songs.shift();
    this._player.stop();
  }

  pause() {
    this._player.pause();
    let pauseEmbed = new Discord.MessageEmbed()
      .setTitle("⏸️ 暫停音樂")
  }

  unpause() {
    this._player.unpause();
  }
  
  async playStream() {
    if (!this._songs[0]?.rawData.full) {
      try {
        this._songs[0].rawData = await play.video_info(this._songs[0].url);
        this._songs[0].rawData.full = true;
      } catch (e) {
        this._channel.send(e.message);
        log.error(e.message);
      }
    }
    
    let stream;
    try {
      stream = await play.stream(this._songs[0].url);
    } catch (e) {
      log.error(e.message);
      let embed = new Discord.MessageEmbed()
        .setTitle("🙁 載入音樂時發生錯誤")
        .setDescription(
          "載入音樂時發生了一點小錯誤...\n"+
          "錯誤內容:\n"+
          "```\n"+e.message+"\n```")
        .setColor(colors.danger);
      this._channel.send({
        embeds: [embed]
      });
      return;
    }
    this._audio = createAudioResource(stream.stream, {
      inputType: stream.type,
      metadata: this._songs[0]
    });
    this._player.play(this._audio);
  }

  get ping() {
    return this._connection.ping;
  }
  
  handelIdle() {
    this._noticeMessage?.delete().catch(this.noop);
    
    this._songs.shift();
    if (this._songs.length <= 0) {
      let endEmbed = new Discord.MessageEmbed()
        .setTitle("👌 序列裡的歌曲播放完畢");
      this._channel.send({
        embeds: [endEmbed]
      })
        .catch(this.noop);
    } else {
      this.playStream();
    }
  }
  
  async handelPlaying() {
    let playingEmbed = new Discord.MessageEmbed()
      .setTitle(`🎵 目前正在播放 ${this._audio.metadata.title}`)
      .setURL(this._audio.metadata.url)
      .setThumbnail(this._audio.metadata.thumbnail)
      .setColor(colors.success);
    this._noticeMessage = await this._channel.send({
      embeds: [playingEmbed]
    })
      .catch(this.noop);
  }
}

module.exports = Player;