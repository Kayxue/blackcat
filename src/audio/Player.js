import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  StreamType
} from "@discordjs/voice";
import Discord from "discord.js";
import play from "play-dl";
import prism from "prism-media";
import VolumeTransformer from "./engine/VolumeTransformer.js";
import allowModify from "../util/allowModify.js";
import log from "../logger.js";
import colors from "../color.js";

export default class Player {
  constructor(interaction, guild, voice) {
    this._client = interaction.client;
    this._channel = interaction.channel;
    this._guild = guild;
    this._guildId = guild.id;
    this._voiceChannel = voice;
    this._channelId = voice.id;

    this._init = false;
    this._paused = false;
    this._muted = false;
    this._loop = false;
    this._repeat = false;
    this._volume = 0.7;
    this._noticeMessage = null;
    this._buttonCollector = null;
    this._nowplaying = null;
    this._songs = [];

    this._engines = {
      opusDecoder: null,
      opusEncoder: null,
      webmDemuxer: null,
      ffmpeg: null,
      volumeTransform: null
    };
    this._encoded = null;
    this._raw = null;
  }

  noop() { }

  init() {
    if (this._init) return;
    try {
      this._connection = joinVoiceChannel({
        guildId: this._guildId,
        channelId: this._channelId,
        adapterCreator: this._guild.voiceAdapterCreator
      });
    } catch (e) {
      log.error(e.message, e);
      let errorEmbed = new Discord.MessageEmbed()
        .setTitle("🙁 加入語音頻道時發生錯誤")
        .setDescription(
          "加入語音頻道時發生了一些錯誤...\n" +
          "錯誤內容:\n" +
          "```\n" + e.message + "\n```")
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
    this._connection.on(VoiceConnectionStatus.Disconnected, async () => {
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
    this._player.once(AudioPlayerStatus.Playing, () => {
      log.info(`${this._guildId}:${this._channelId} 音樂播放器進入播放狀態`);
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

  async play(track, interaction) {
    let rawData, parsedData, isPlaylist = false;

    let searchEmbed = new Discord.MessageEmbed()
      .setTitle(`🔍 正在搜尋 **${track}**`)
      .setColor(colors.success);
    interaction.editReply({
      embeds: [searchEmbed]
    }).catch(this.noop);

    if (play.yt_validate(track) !== "video" && !track.startsWith("https")) {
      try {
        let result = await play.search(track, {
          limit: 1
        });
        rawData = await play.video_info(result[0]?.url);
        if (!rawData) {
          return this._channel.send("Nothing found");
        }
        rawData.full = false;
      } catch (e) {
        return this.handelYoutubeError(e);
      }
    } else if (play.yt_validate(track) === "video") {
      try {
        rawData = await play.video_info(track);
        rawData.full = true;
      } catch (e) {
        return this.handelYoutubeError(e);
      }
    } else {
      let videos;
      isPlaylist = true;
      try {
        let playlist = await play.playlist_info(track, {
          incomplete: true
        });
        videos = await playlist.all_videos();
      } catch (e) {
        return this.handelYoutubeError(e);
      }
      let playlistEmbed = new Discord.MessageEmbed()
        .setTitle(`🔍 已加入整個播放清單，共有 **${videos.length}** 首歌曲`)
        .setColor(colors.success);
      interaction.followUp({
        embeds: [playlistEmbed]
      });

      parsedData = [];
      videos.forEach((video) => {
        video.full = false;
        parsedData.push({
          title: video.title,
          url: video.url,
          duraction: video.duractionInSec,
          duractionParsed: video.duractionRaw,
          thumbnail: video.thumbnails.pop().url,
          queuer: interaction.user.username,
          rawData: video
        });
      });
    }
    if (!isPlaylist) parsedData = [{
      title: rawData.video_details.title,
      url: rawData.video_details.url,
      duraction: rawData.video_details.durationInSec,
      duractionParsed: rawData.video_details.durationRaw,
      thumbnail: rawData.video_details.thumbnails.pop().url,
      queuer: interaction.user.username,
      rawData
    }];

    if (this._songs.length === 0) {
      this._songs.push(...parsedData);
      this.playStream();
    } else {
      this._songs.push(...parsedData);
      let addedEmbed = new Discord.MessageEmbed()
        .setTitle("✅ 已加入播放清單")
        .setDescription(`播放清單內有 ${this._songs.length} 首歌曲`)
        .setColor(colors.success);
      interaction.editReply({
        embeds: [addedEmbed]
      });
    }
  }

  skip(interaction) {
    let skipEmbed = new Discord.MessageEmbed()
      .setTitle(`⏭️ 跳過歌曲 **${this._audio.metadata.title}**`)
      .setColor(colors.success);
    this._player.stop();
    interaction.reply({
      embeds: [skipEmbed]
    }).catch(this.noop);
  }

  pause(interaction) {
    let pauseEmbed = new Discord.MessageEmbed()
      .setTitle("⏸️ 暫停音樂")
      .setColor(colors.success);
    this._paused = true;
    this._player.pause();
    interaction.reply({
      embeds: [pauseEmbed]
    }).catch(this.noop);
    this.updateNoticeEmbed();
  }

  unpause(interaction) {
    let unpauseEmbed = new Discord.MessageEmbed()
      .setTitle("▶️ 繼續播放音樂")
      .setColor(colors.success);
    this._paused = false;
    this._player.unpause();
    interaction.reply({
      embeds: [unpauseEmbed]
    }).catch(this.noop);
    this.updateNoticeEmbed();
  }

  shuffle(interaction) {
    let shuffled = [].concat(this._songs);
    let currentIndex = this._songs.length, temporaryValue, randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = shuffled[currentIndex];
      shuffled[currentIndex] = shuffled[randomIndex];
      shuffled[randomIndex] = temporaryValue;
    }

    let shuffleEmbed = new Discord.MessageEmbed()
      .setTitle("🔀 重新排序音樂")
      .setColor(colors.success);
    this._songs = shuffled;
    interaction.reply({
      embeds: [shuffleEmbed]
    }).catch(this.noop);
  }

  stop(interaction) {
    let stopEmbed = new Discord.MessageEmbed()
      .setTitle("⏹️ 停止播放音樂")
      .setColor(colors.success);
    this._songs = [];
    this._player.stop();
    this._connection.destroy();
    interaction.reply({
      embeds: [stopEmbed]
    }).catch(this.noop);
  }

  loop(interaction) {
    let loopEmbed = new Discord.MessageEmbed()
      .setTitle("🔁 重複播放所有歌曲")
      .setColor(colors.success);
    this._loop = true;
    this._repeat = false;
    interaction.reply({
      embeds: [loopEmbed]
    }).catch(this.noop);
    this.updateNoticeEmbed();
  }

  repeat(interaction) {
    let repeatEmbed = new Discord.MessageEmbed()
      .setTitle("🔂 重複播放目前的歌曲")
      .setColor(colors.success);
    this._loop = false;
    this._repeat = true;
    interaction.reply({
      embeds: [repeatEmbed]
    }).catch(this.noop);
    this.updateNoticeEmbed();
  }

  async playStream() {
    if (!this._songs[0]?.rawData.full) {
      try {
        this._songs[0].rawData = await play.video_info(this._songs[0].url);
        this._songs[0].rawData.full = true;
      } catch (e) {
        this.handelYoutubeError(e);
      }

      this._songs[0] = {
        title: this._songs[0].rawData.title,
        url: this._songs[0].rawData.url,
        duraction: this._songs[0].rawData.duractionInSec,
        duractionParsed: this._songs[0].rawData.duractionRaw,
        thumbnail: this._songs[0].rawData.thumbnails.pop().url,
        queuer: this._songs[0].queuer,
        rawData: this._songs[0].rawData
      };
    }

    try {
      this._raw = await play.stream(this._songs[0].url);
    } catch (e) {
      this.handelYoutubeError(e);
    }

    if (this._raw.type === "opus") {
      this._engines.opusDecoder = new prism.opus.Decoder({
        channels: 2,
        frameSize: 960,
        rate: 48000
      });
      this._engines.volumeTransform = new VolumeTransformer({
        volume: this._volume
      });
      this._engines.opusEncoder = new prism.opus.Encoder({
        channels: 2,
        frameSize: 960,
        rate: 48000
      });
      this._encoded = this._raw.stream
        .pipe(this._engines.opusDecoder)
        .pipe(this._engines.volumeTransform)
        .pipe(this._engines.opusEncoder);
    } else if (this._raw.type === "webm/opus") {
      this._engines.webmDemuxer = new prism.opus.WebmDemuxer();
      this._engines.opusDecoder = new prism.opus.Decoder({
        channels: 2,
        frameSize: 960,
        rate: 48000
      });
      this._engines.volumeTransform = new VolumeTransformer({
        volume: this._volume
      });
      this._engines.opusEncoder = new prism.opus.Encoder({
        channels: 2,
        frameSize: 960,
        rate: 48000
      });
      this._encoded = this._raw.stream
        .pipe(this._engines.webmDemuxer)
        .pipe(this._engines.opusDecoder)
        .pipe(this._engines.volumeTransform)
        .pipe(this._engines.opusEncoder);
    } else {
      this._engines.ffmpeg = new prism.FFmpeg({
        args: ["-analyzeduration", "0", "-loglevel", "0", "-f", "s16le", "-ar", "48000", "-ac", "2"]
      });
      this._engines.volumeTransform = new prism.VolumeTransformer({
        volume: this._volume,
        type: "s16le"
      });
      this._engines.opusEncoder = new prism.opus.Encoder({
        channels: 2,
        frameSize: 960,
        rate: 48000
      });
      this._encoded = this._raw.stream
        .pipe(this._engines.ffmpeg)
        .pipe(this._engines.volumeTransform)
        .pipe(this._engines.opusEncoder);
    }
    this._audio = createAudioResource(this._encoded, {
      inputType: StreamType.Opus,
      metadata: this._songs[0]
    });
    this._player.play(this._audio);
    
    let playingEmbed = new Discord.MessageEmbed()
      .setTitle("🕒 載入中...")
      .setColor(colors.warning);

    this._noticeMessage = await this._channel.send({
      embeds: [playingEmbed]
    }).catch(this.noop);
    this._buttonCollector = this._noticeMessage?.createMessageComponentCollector({
      componentType: "BUTTON"
    });

    this.updateNoticeEmbed();

    this._buttonCollector?.on("collect", (interaction) => this.handelButtonClick(interaction));
  }

  updateNoticeEmbed() {
    let musicButton = new Discord.MessageButton()
      .setCustomId("pause")
      .setEmoji(this._paused ? "<:play:827734196243398668>" : "<:pause:827737900359745586>")
      .setStyle("PRIMARY");
    let skipButton = new Discord.MessageButton()
      .setCustomId("skip")
      .setEmoji("<:skip:827734282318905355>")
      .setStyle("PRIMARY");
    let stopButton = new Discord.MessageButton()
      .setCustomId("stop")
      .setEmoji("<:stop:827734840891015189>")
      .setStyle("DANGER");

    let volDownButton = new Discord.MessageButton()
      .setCustomId("voldown")
      .setEmoji("<:vol_down:827734683340111913>")
      .setStyle("SECONDARY");
    let volUpButton = new Discord.MessageButton()
      .setCustomId("volup")
      .setEmoji("<:vol_up:827734772889157722>")
      .setStyle("SECONDARY");
    let hintButton = new Discord.MessageButton()
      .setCustomId("mute")
      .setEmoji("<:mute:827734384606052392>")
      .setStyle("SECONDARY");

    if (this._songs.length <= 1) skipButton.setDisabled(true);
    if (this._volume >= 1 || this._muted) volUpButton.setDisabled(true);
    if (this._volume <= 0 || this._muted) volDownButton.setDisabled(true);

    let rowOne = new Discord.MessageActionRow()
      .addComponents(musicButton, skipButton, stopButton);
    let rowTwo = new Discord.MessageActionRow()
      .addComponents(volDownButton, volUpButton, hintButton);

    let playingEmbed = new Discord.MessageEmbed()
      .setDescription(`🎵 目前正在播放 [${this._audio.metadata.title}](${this._audio.metadata.url})`)
      .setThumbnail(this._audio.metadata.thumbnail)
      .setColor(colors.success);

    this._noticeMessage?.edit({
      embeds: [playingEmbed],
      components: [rowOne, rowTwo]
    }).catch(this.noop);
  }

  get ping() {
    return this._connection.ping;
  }

  get nowplaying() {
    return this._audio.metadata;
  }

  get playTime() {
    return this._audio.playbackDuration / 1000;
  }

  get songs() {
    return this._songs;
  }

  get volume() {
    return this._engines.volumeTransform?.volume;
  }

  get pauseState() {
    return this._paused;
  }

  set volume(volume) {
    this._muted = false;
    if (volume >= 1) {
      this._volume = 1;
    } else if (volume <= 0) {
      this._volume = 0;
    } else {
      this._volume = volume;
    }
    this._engines.volumeTransform.setVolume(Math.round(this._volume * 100) / 100);
    
    this.updateNoticeEmbed();
  }

  handelYoutubeError(e) {
    if (e.message.includes("confirm your age")) {
      let invaildEmbed = new Discord.MessageEmbed()
        .setTitle("😱 我沒辦法取得你想播放的音樂，因為需要登入帳號")
        .setColor(colors.danger);
      return this._channel.send({
        embeds: [invaildEmbed]
      });
    } else if (e.message.includes("429")) {
      let limitEmbed = new Discord.MessageEmbed()
        .setTitle("😱 現在無法取得這個音樂，請稍後再試")
        .setColor(colors.danger);
      return this._channel.send({
        embeds: [limitEmbed]
      });
    } else if (e.message.includes("private")) {
      let privateEmbed = new Discord.MessageEmbed()
        .setTitle("😱 這是私人影片")
        .setColor(colors.danger);
      return this._channel.send({
        embeds: [privateEmbed]
      });
    }
    log.error(e.message, e);
  }

  handelIdle() {
    this._noticeMessage?.delete().catch(this.noop);

    let playedSong = this._songs.shift();
    if (this._loop) this._songs.push(playedSong);
    if (this._repeat) this._songs.unshift(playedSong);
    this._noticeMessage?.delete().catch(() => {});
    this._noticeMessage = null;
    if (this._songs.length === 0) {
      try {
        this._encoded?.destroy();
        this._engines.volumeTransform?.destroy();
        this._engines.opusDecoder?.destroy();
        this._engines.opusEncoder?.destroy();
        this._engines.webmDemuxer?.destroy();
        this._engines.ffmpeg?.destroy();
      // eslint-disable-next-line no-empty
      } catch {}
      let endEmbed = new Discord.MessageEmbed()
        .setTitle("👌 序列裡的歌曲播放完畢")
        .setColor(colors.success);
      this._channel.send({
        embeds: [endEmbed]
      }).catch(this.noop);
      this._client.players.delete(this._guildId);
      this._connection.destroy();
    } else {
      this.playStream();
    }
  }

  handelButtonClick(interaction) {
    if (!allowModify(interaction)) {
      return interaction.reply({
        content: "❌ 你必須跟我在同一個頻道裡!",
        ephemeral: true
      }).catch(this.noop);
    }

    let replyMessage = "";
    switch (interaction.customId) {
    case "pause":
      if (this._paused) {
        this._player.unpause();
        this._paused = false;
        replyMessage = "▶️ 繼續播放音樂";
      } else if (!this._paused) {
        this._player.pause();
        this._paused = true;
        replyMessage = "⏸️ 暫停播放音樂";
      }
      break;
    case "skip":
      this._player.stop();
      replyMessage = "⏭️ 跳過音樂";
      break;
    case "stop":
      this._songs = [];
      this._player.stop();
      replyMessage = "⏹️ 停止播放音樂";
      this._connection.destroy();
      this._client.players.delete(this._guildId);
      break;
    case "volup":
      this.volume = this._volume + 0.1;
      replyMessage = `🔊 音量增加10%, 目前音量為 ${this._volume}`;
      break;
    case "voldown":
      this.volume = this._volume - 0.1;
      replyMessage = `🔊 音量減少10%, 目前音量為 ${this._volume}`;
      break;
    case "mute":
      if (this._muted) {
        this._engines.volumeTransform.setVolume(this._volume);
        this._muted = false;
        replyMessage = `🔊 音量恢復至${this._volume * 100}%`;
      } else {
        this._engines.volumeTransform.setVolume(0);
        this._muted = true;
        replyMessage = "🔇 靜音音樂";
      }
      break;
    default:
      interaction.reply("❌ 發生了億點點的錯誤");
      return;
    }
    let clickEmbed = new Discord.MessageEmbed()
      .addField(replyMessage, "\u200b")
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL({
          dynamic: true
        })
      })
      .setColor(colors.success);
    interaction.reply({
      embeds: [clickEmbed]
    }).catch(this.noop);
    setTimeout(() => {
      interaction.deleteReply().catch(this.noop);
    }, 30000);

    this.updateNoticeEmbed();
  }
}
