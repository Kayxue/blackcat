const Discord = require("discord.js");
const voice = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const util = require("../util/Util");
const EventEmitter = require("node:events");
const { opus, FFmpeg, VolumeTransformer } = require("prism-media");

/**
 * Player class
 */
class Player {
  /**
   * @param {(Discord.VoiceChannel|Discord.StageChannel)} channel Server voice channel
   * @param {Discord.TextChannel} textChannel Server text channel
   * @param {Discord.Client} client Discord.js Client
   */
  constructor(channel, textChannel, client) {
    // Client
    this.client = client;

    // Song list
    this.songList = [];
    this.now = null;

    // Song behavior
    this.behavior = {
      volume: 60,
      playing: true,
      loop: false,
      repeat: false,
      muted: false,
      filter: [],
      mutedVolume: null
    };

    // Player
    this.audioPlayer = voice.createAudioPlayer();

    // Voice connection
    this.connection = voice.joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    this.voiceChannel = channel;
    this.connection.subscribe(this.audioPlayer);

    // YTDL stream
    this.stream = null;

    // Encoded stream
    this.encoded = null;

    // Audio resource
    this.audioResource = null;

    // Text channel
    this.text = textChannel;

    // Guild (From text channel)
    this.guild = textChannel.guild;

    // Error events
    this.connection.on(voice.VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          voice.entersState(this.connection, voice.VoiceConnectionStatus.Signalling, 5000),
          voice.entersState(this.connection, voice.VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch (error) {
        this.client.players.delete(this.text.guildId);
        this.connection.destroy();
        if (this.collector) this.collector.stop();
        this.text.send("🎈 ┃ 語音頻道連結斷開，音樂已停止");
      }
    });

    // Converts
    this.ffmpeg = null;
    this.opus = null;
    this.volumeTransformer = null;

    // Controller
    this.collector = null;

    // Lock vers
    this.disconnected = false;

    // Event cotroller
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Track data
   * @typedef {Object} Track
   * @property {String} title Song title
   * @property {String} url Song URL
   * @property {(Number|String|null)} duration Song duration in millieseconds
   * @property {String} thumbnail Song thumbnail
   * @property {String} type Song type (song, playlist)
   * @property {String} by Username who queued this song
   */

  /**
   * Voice connection ping data
   * @typedef {Object} connectionPing
   * @property {(undefined|Number)} udp UDP connection ping
   * @property {(undefined|Number)} ws WebSocket connection ping
   */

  /**
   * Start player
   */
  start() {
    return new Promise(async (resolve, reject) => {
      this.behavior.playing = true;
      try {
        if (this.voiceChannel.type === "GUILD_STAGE_VOICE") {
          if (!this.voiceChannel.stageInstance) {
            await this.voiceChannel.createStageInstance({
              topic: "🎵 Loading...",
              privacyLevel: "GUILD_ONLY"
            });
          }
          await this.voiceChannel.guild.me.voice.setSuppressed(false);
        }
      } catch {
        this.destroy();
        reject();
      }
      this._getStream(this.songList[0].url);
      resolve();
    });
  }

  /**
   * Add songs
   * @param {Array<Track>} songs Array of song data
   */
  add(songs) {
    songs.forEach(song => {
      this.songList.push(song);
    });
  }

  /**
   * Skip current song
   */
  skip() {
    this.behavior.playing = true;
    this.collector?.stop();
    if (this.behavior.loop) {
      let lastSong = this.songList.shift();
      this.songList.push(lastSong);
    } else if (!this.behavior.repeat) {
      this.songList.shift();
    }
    if (this.songList.length <= 0) {
      this.stop();
    }
    this._getStream(this.songList[0].url);
  }

  /**
   * Pause player
   */
  pause() {
    this.behavior.playing = false;
    this.audioPlayer.pause();
    this.eventEmitter.emit("embedUpdate");
  }

  /**
   * Change current volume
   * @param {Number} volume Volume
   */
  setVolume(volume) {
    this.behavior.volume = parseInt(volume);
    this.volumeTransformer.setVolumeLogarithmic(parseInt(volume) / 100);
    this.eventEmitter.emit("embedUpdate");
  }

  /**
   * Resume paused song
   */
  resume() {
    this.audioPlayer.unpause();
    this.eventEmitter.emit("embedUpdate");
  }

  /**
   * Stop player
   */
  stop() {
    this.text.send("👌 ┃ 播放清單播放完畢");
    this.destroy();
  }

  /**
   * Loop music
   * @param {Boolean} value Value
   */
  toggleLoop(value = !this.behavior.loop) {
    this.behavior.repeat = false;
    this.behavior.loop = value;
    this.eventEmitter.emit("embedUpdate");
  }

  /**
   * Destroy voice connection and stream
   * @param {Boolean} force Force destroy voice connection
   */
  destroy(force) {
    this.opus?.destroy();
    this.volumeTransformer?.destroy();
    this.stream?.destroy();
    this.encoded?.destroy();
    this.collector?.stop();
    this.songList = [];
    this.audioPlayer.stop();
    if (this.voiceChannel.stageInstance) {
      this.voiceChannel.stageInstance.setTopic("🎵 音樂已結束");
    }
    if (!this.disconnected && !force) this.connection.destroy();
    this.disconnected = true;
    this.client.players.delete(this.text.guildId);
    this.client.log(`${Discord.Util.removeMentions(this.guild.name)} Queue ended`);
  }

  /**
   * Repeat music
   * @param {Boolean} value Value
   */
  toggleRepeat(value = !this.behavior.repeat) {
    this.behavior.loop = false;
    this.behavior.repeat = value;
    this.eventEmitter.emit("embedUpdate");
  }

  /**
   * Get song list
   * @return {Array<Track>} All queued song
   */
  get songs() {
    return this.songList;
  }

  /**
   * Modify song list
   */
  set songs(songs) {
    this.songList = songs;
  }


  /**
   * Get filters
   * @return {Array<String>} Filters
   */
  get filter() {
    return this.behavior.filter;
  }

  /**
   * Set filter
   * @param {Array<String>} filterArray Filters
   */
  set filter(filterArray) {
    this.behavior.filter = filterArray;
  }

  /**
   * Get now play time
   * @return {Number} Total playing time
   */
  get playTime() {
    return this.audioResource.playbackDuration / 1000;
  }

  /**
   * Get queue text channel
   * @return {Discord.TextChannel} Text channel
   */
  get textChannel() {
    return this.text;
  }

  /**
   * Get current playing
   * @return {Track} Current playing track
   */
  get current() {
    return this.now;
  }

  /**
   * Check is music playing
   * @return {Boolean} Is music playing?
   */
  get playing() {
    return this.behavior.playing;
  }

  /**
   * Get repeat status
   * @return {Boolean} Is repeat enabled?
   */
  get repeat() {
    return this.behavior.repeat;
  }

  /**
   * Get loop status
   * @return {Boolen} Is loop enabled?
   */
  get loop() {
    return this.behavior.loop;
  }

  /**
   * Get voice connection ping
   * @return {connectionPing} voice connection ping
   */
  get ping() {
    return this.connection.ping;
  }

  /**
   * Get volume
   * @return {Number} Get current volume
   */
  get volume() {
    return this.behavior.volume;
  }

  /**
   * Get audio stream and play it
   * @private
   * @param {String} url YouTube video URL
   */
  async _getStream(url) {
    this.client.log(`${Discord.Util.removeMentions(this.guild.name)} Getting stream`);
    this.now = this.songList[0];

    let videoInfo = null;

    if (this.now.info) videoInfo = this.now.info;

    try {
      if (!videoInfo) videoInfo = await ytdl.getInfo(url);
    } catch (error) {
      if (error.message.includes("private") || error.message.includes("403")) {
        this.text.send("❌ ┃ 無法播放私人影片");
      } else if (error.message.includes("429")) {
        this.text.send("❌ ┃ 發生YouTube API錯誤...");
      } else if (error.message.includes("404")) {
        this.text.send("❌ ┃ 找不到影片或YouTube API已更新，請等待機器人更新!");
      } else {
        this.text.send("❌ ┃ 發生未知的錯誤");
      }
      this.client.log(`${Discord.Util.removeMentions(this.guild.name)} ${error.message}`);
      return this.skip();
    }

    this.stream = ytdl.downloadFromInfo(videoInfo, {
      highWaterMark: 1 << 20,
      maxReconnects: 3
    });

    let encoderArgs = [
      "-analyzeduration", "0",
      "-loglevel", "0",
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2"
    ];
    if (this.behavior.filter.length > 0) {
      encoderArgs = encoderArgs.concat(["-af", this.behavior.filter.join(",")]);
    }

    this.ffmpeg = new FFmpeg({
      args: encoderArgs
    });
    this.volumeTransformer = new VolumeTransformer({
      volume: this.behavior.volume / 100,
      type: "s16le"
    });
    this.opus = new opus.Encoder({
      rate: 48000,
      channels: 2,
      frameSize: 960
    });
    this.encoded = this.stream
      .pipe(this.ffmpeg)
      .pipe(this.volumeTransformer)
      .pipe(this.opus);
    this._playStream();
  }

  /**
   * Play stream
   * @private
   */
  async _playStream() {
    this.client.log(`${Discord.Util.removeMentions(this.guild.name)} Start playing stream`);
    this.audioPlayer.removeAllListeners();
    this.eventEmitter.removeAllListeners();
    let song = this.songList[0];
    this.audioResource = voice.createAudioResource(this.encoded, {
      inputType: voice.StreamType.Opus
    });
    this.audioPlayer.play(this.audioResource);
    if (this.behavior.muted && this.behavior.mutedVolume) {
      this.behavior.volume = this.behavior.mutedVolume ?? 60;
      this.behavior.muted = false;
    }
    this.volumeTransformer.setVolume(this.behavior.volume / 100);
    if (this.voiceChannel.type === "GUILD_STAGE_VOICE") this.voiceChannel.stageInstance
      .setTopic(`🎵 目前播放: ${this.now.title.substr(0, 110)}`)
      .catch((error) => {
        console.log(error.message);
        this.voiceChannel.stageInstance
          .setTopic("🎵 音樂播放中!")
          .catch(console.error);
      });

    let embed = new Discord.MessageEmbed()
      .setColor("BLURPLE")
      .setDescription(`<:music:825646714404077569> ┃ 正在播放 [${Discord.Util.escapeMarkdown(song.title)}](${song.url})`)
      .setThumbnail(song.thumbnail)
      .addField("🔊 ┃ 目前音量", `${this.behavior.volume}%`, true);
    if (this.behavior.loop) {
      embed.addField("🔁 ┃ 全部重複", "將會重複所有歌曲", true);
    }
    if (this.behavior.repeat) {
      embed.addField("🔂 ┃ 單曲重複", "將會重複目前播放的歌曲", true);
    }
    embed.addField("🕒 ┃ 歌曲長度", new Date(song.duration * 1000).toISOString().substr(11, 8), true);
    embed.addField("❓ ┃ 點歌者", Discord.Util.escapeMarkdown(song.by), true);
    embed.addField("🎛️ ┃ 網頁面板", `https://app.blackcatbot.tk/?server=${this.text.guildId}`, true);

    let skipBtn = new Discord.MessageButton()
      .setLabel("跳過")
      .setStyle("PRIMARY")
      .setEmoji("827734282318905355")
      .setCustomId("skip");
    let pauseBtn = new Discord.MessageButton()
      .setLabel("暫停")
      .setStyle("PRIMARY")
      .setEmoji("827737900359745586")
      .setCustomId("pause");
    let stopBtn = new Discord.MessageButton()
      .setLabel("停止")
      .setStyle("DANGER")
      .setEmoji("827734840891015189")
      .setCustomId("stop");
    let volupBtn = new Discord.MessageButton()
      .setLabel("上升")
      .setStyle("SUCCESS")
      .setEmoji("827734772889157722")
      .setCustomId("vol_up");
    let muteBtn = new Discord.MessageButton()
      .setLabel("靜音")
      .setStyle("SUCCESS")
      .setEmoji("827734384606052392")
      .setCustomId("mute");
    let voldownBtn = new Discord.MessageButton()
      .setLabel("下降")
      .setStyle("SUCCESS")
      .setEmoji("827734683340111913")
      .setCustomId("vol_down");
    let playControl = new Discord.MessageActionRow()
      .addComponents(skipBtn, pauseBtn, stopBtn);
    let volumeControl = new Discord.MessageActionRow()
      .addComponents(voldownBtn, muteBtn, volupBtn);

    let controller = await this.text.send({
      embeds: [embed],
      components: [playControl, volumeControl]
    });

    this.eventEmitter.on("embedUpdate", () => {
      if (this.behavior.playing) {
        pauseBtn
          .setLabel("暫停")
          .setEmoji("827737900359745586");
      } else {
        pauseBtn
          .setLabel("繼續播放")
          .setEmoji("827734196243398668");
      }
      playControl = new Discord.MessageActionRow()
        .addComponents(skipBtn, pauseBtn, stopBtn);

      if (this.behavior.muted) {
        volupBtn.setDisabled(true);
        voldownBtn.setDisabled(true);
        muteBtn.setLabel("解除靜音");
      } else {
        if (this.behavior.volume >= 100) volupBtn.setDisabled(true);
        else volupBtn.setDisabled(false);
        if (this.behavior.volume <= 0) voldownBtn.setDisabled(true);
        else voldownBtn.setDisabled(false);

        muteBtn.setLabel("靜音");
      }
      volumeControl = new Discord.MessageActionRow()
        .addComponents(voldownBtn, muteBtn, volupBtn);

      embed = new Discord.MessageEmbed()
        .setColor("BLURPLE")
        .setDescription(`<:music:825646714404077569> ┃ 正在播放 [${Discord.Util.escapeMarkdown(song.title)}](${song.url})`)
        .setThumbnail(song.thumbnail)
        .addField("🔊 ┃ 目前音量", `${this.behavior.volume}%`, true);
      if (this.behavior.loop) {
        embed.addField("🔁 ┃ 全部重複", "將會重複所有歌曲", true);
      }
      if (this.behavior.repeat) {
        embed.addField("🔂 ┃ 單曲重複", "將會重複目前播放的歌曲", true);
      }
      embed.addField("🕒 ┃ 歌曲長度", new Date(song.duration * 1000).toISOString().substr(11, 8), true);
      embed.addField("❓ ┃ 點歌者", Discord.Util.escapeMarkdown(song.by), true);
      embed.addField("🎛️ ┃ 網頁面板", `https://app.blackcatbot.tk/?server=${this.text.guildId}`, true);

      controller.edit({
        embeds: [embed],
        components: [playControl, volumeControl]
      });
    });

    this.collector = controller.createMessageComponentCollector();
    this.collector.on("collect", async btn => {
      const member = btn.member;
      if (!util.canModifyQueue(member)) return btn.reply({
        content: "❌ ┃ 請加入語音頻道!",
        ephemeral: true
      });

      switch (btn.customId) {
      case "skip":
        this.behavior.playing = true;
        this.skip();
        btn.reply(`<:skip:827734282318905355> ┃ **${Discord.Util.escapeMarkdown(btn.user.username)}** 跳過了這一首歌曲`).catch(console.error);
        break;

      case "pause":
        if (this.behavior.playing) {
          pauseBtn
            .setLabel("繼續播放")
            .setEmoji("827734196243398668");
          playControl = new Discord.MessageActionRow()
            .addComponents(skipBtn)
            .addComponents(pauseBtn)
            .addComponents(stopBtn);
          controller.edit({
            embeds: [embed],
            components: [playControl, volumeControl]
          }).catch(console.error);
          this.behavior.playing = !this.behavior.playing;
          this.pause();
          btn.reply(`<:pause:827737900359745586> ┃ 歌曲被 **${Discord.Util.escapeMarkdown(btn.user.username)}** 暫停了`).catch(console.error);
        } else {
          pauseBtn
            .setLabel("暫停")
            .setEmoji("827737900359745586");
          playControl = new Discord.MessageActionRow()
            .addComponents(skipBtn)
            .addComponents(pauseBtn)
            .addComponents(stopBtn);
          controller.edit({
            embeds: [embed],
            components: [playControl, volumeControl]
          }).catch(console.error);
          this.behavior.playing = !this.behavior.playing;
          this.resume();
          btn.reply(`<:play:827734196243398668> ┃ **${Discord.Util.escapeMarkdown(btn.user.username)}** 繼續播放目前的歌曲`).catch(console.error);
        }
        break;

      case "mute":
        if (this.behavior.muted) {
          this.behavior.volume = this.behavior.mutedVolume;
          this.behavior.mutedVolume = null;
          this.behavior.muted = false;
          this.volumeTransformer.setVolumeLogarithmic(this.behavior.volume / 100);
          if (this.behavior.volume !== 100) volupBtn.setDisabled(true);
          else volupBtn.setDisabled(false);
          if (this.behavior.volume !== 0) voldownBtn.setDisabled(true);
          else voldownBtn.setDisabled(false);
          muteBtn.setLabel("靜音");
          volumeControl = new Discord.MessageActionRow()
            .addComponents(voldownBtn)
            .addComponents(muteBtn)
            .addComponents(volupBtn);
          controller.edit({
            embeds: [embed],
            components: [playControl, volumeControl]
          }).catch(console.error);
          btn.reply(`<:vol_up:827734772889157722> ┃ **${Discord.Util.escapeMarkdown(btn.user.username)}** 將音樂解除靜音`).catch(console.error);
        } else {
          this.behavior.muted = true;
          this.behavior.mutedVolume = this.behavior.volume;
          this.behavior.volume = 0;
          this.volumeTransformer.setVolumeLogarithmic(0);
          volupBtn.setDisabled(true);
          voldownBtn.setDisabled(true);
          muteBtn.setLabel("解除靜音");
          volumeControl = new Discord.MessageActionRow()
            .addComponents(voldownBtn)
            .addComponents(muteBtn)
            .addComponents(volupBtn);
          controller.edit({
            embeds: [embed],
            components: [playControl, volumeControl]
          }).catch(console.error);
          btn.reply(`<:mute:827734384606052392> ┃ **${Discord.Util.escapeMarkdown(btn.user.username)}** 將音樂靜音了`).catch(console.error);
        }
        break;

      case "vol_down":
        if (this.behavior.volume - 10 <= 0) {
          this.behavior.volume = 0;
          voldownBtn.setDisabled(true);
        }
        else this.behavior.volume = this.behavior.volume - 10;
        volupBtn.setDisabled(false);
        volumeControl = new Discord.MessageActionRow()
          .addComponents(voldownBtn)
          .addComponents(muteBtn)
          .addComponents(volupBtn);
        controller.edit({
          embeds: [embed],
          components: [playControl, volumeControl]
        }).catch(console.error);
        this.volumeTransformer.setVolumeLogarithmic(this.behavior.volume / 100);
        btn.reply(`<:vol_down:827734683340111913> ┃ **${Discord.Util.escapeMarkdown(btn.user.username)}** 降低了音量, 目前音量為 ${this.behavior.volume}%`).catch(console.error);
        break;

      case "vol_up":
        if (this.behavior.volume + 10 >= 100) {
          this.behavior.volume = 100;
          volupBtn.setDisabled(true);
        }
        else this.behavior.volume = this.behavior.volume + 10;
        voldownBtn.setDisabled(false);
        volumeControl = new Discord.MessageActionRow()
          .addComponents(voldownBtn)
          .addComponents(muteBtn)
          .addComponents(volupBtn);
        controller.edit({
          embeds: [embed],
          components: [playControl, volumeControl]
        }).catch(console.error);
        this.volumeTransformer.setVolumeLogarithmic(this.behavior.volume / 100);
        btn.reply(`<:vol_up:827734772889157722> ┃ **${Discord.Util.escapeMarkdown(btn.user.username)}** 提高了音量, 目前音量為 ${this.behavior.volume}%`).catch(console.error);
        break;

      case "stop":
        this.stop();
        btn.reply(`<:stop:827734840891015189> ┃ **${Discord.Util.escapeMarkdown(btn.user.username)}** 將音樂停止了`).catch(console.error);
        break;
      }
    });

    this.collector.on("end", async () => {
      this.eventEmitter.removeAllListeners();
      controller.delete().catch(console.error);
    });

    this.audioPlayer.on("stateChange", (oldState, newState) => {
      if (newState.status === voice.AudioPlayerStatus.Idle && oldState.status !== voice.AudioPlayerStatus.Idle) {
        this.opus?.destroy();
        this.volumeTransformer?.destroy();
        this.stream?.destroy();
        this.encoded?.destroy();
        this.ffmpeg?.destroy();
        this.audioResource = null;
        this.collector.stop();
        if (this.behavior.loop) {
          let lastSong = this.songList.shift();
          this.songList.push(lastSong);
        } else if (!this.behavior.repeat) {
          this.songList.shift();
        }
        if (this.songList.length === 0) {
          this.stop();
        } else {
          this._getStream(this.songList[0].url);
        }
      }
    });
  }
}

module.exports = Player;
