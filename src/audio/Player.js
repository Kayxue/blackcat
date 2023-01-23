import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  StreamType,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import Discord from "discord.js";
import prism from "prism-media";
import Canvas from "@napi-rs/canvas";
import imageSize from "image-size";
import play from "play-dl";
import SampleRate from "./engine/libsamplerate/index.js";
import VolumeTransformer from "./engine/VolumeTransformer.js";
import allowModify from "../util/allowModify.js";
import moveArray from "../util/moveArray.js";
import log from "../logger.js";
import colors from "../color.js";
import { request } from "undici";
import { join, resolve } from "node:path";

export default class Player {
  constructor(interaction, guild, voice) {
    this._client = interaction.client;
    this._channel = interaction.channel;
    this._guild = guild;
    this._guildId = guild.id;
    this._voiceChannel = voice;
    this._channelId = voice.id;
    this._optimize = interaction.client.config.optimizeQuality;

    this._init = false;
    this._paused = false;
    this._muted = false;
    this._loop = false;
    this._repeat = false;
    this._nightcore = false;
    this._guildDeleted = false;
    this._stopped = false;
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
      volumeTransform: null,
      libsamplerate: null,
    };
    this._encoded = null;
    this._raw = null;

    if (interaction.client.config.cookie) {
      play.setToken({
        youtube: {
          cookie: interaction.client.config.cookie,
        },
      });
    }
  }

  noop() {}

  async init() {
    if (this._init) return;
    try {
      this._connection = joinVoiceChannel({
        guildId: this._guildId,
        channelId: this._channelId,
        adapterCreator: this._guild.voiceAdapterCreator,
      });
    } catch (e) {
      log.error(e.message, e, "音樂: 啟動");
      const errorEmbed = new Discord.EmbedBuilder()
        .setTitle("🙁 ┃ 加入語音頻道時發生錯誤")
        .setDescription(
          "加入語音頻道時發生了一些錯誤...\n" +
            "錯誤內容:\n" +
            "```\n" +
            e.message +
            "\n```",
        )
        .setColor(colors.danger);
      this._channel.send({
        embeds: [errorEmbed],
      });
      return;
    }

    if (this._voiceChannel.type === "GUILD_STAGE_VOICE") {
      try {
        this.setSpeaker();
      } catch (e) {
        const notSpeakerEmbed = new Discord.EmbedBuilder()
          .setTitle("🙁 ┃ 我無法變成演講者，可能會無法聽到音樂")
          .setColor(colors.danger);
        this._channel
          .send({
            embeds: [notSpeakerEmbed],
          })
          .catch(this.noop);
      }
    }

    this._player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    this._connection.subscribe(this._player);

    this._connection.on(VoiceConnectionStatus.Ready, () => {
      log.info(
        `${this._guildId}:${this._channelId} 已進入預備狀態`,
        "音樂: 連結",
      );
    });
    this._connection.on(
      VoiceConnectionStatus.Disconnected,
      async () => {
        log.warn(
          `${this._guildId}:${this._channelId} 語音斷開連結`,
          "音樂: 連結",
        );
        try {
          await Promise.race([
            entersState(
              this._connection,
              VoiceConnectionStatus.Signalling,
              5_000,
            ),
            entersState(
              this._connection,
              VoiceConnectionStatus.Connecting,
              5_000,
            ),
          ]);
          log.info(
            `${this._guildId}:${this._channelId} 重新連接成功`,
            "音樂: 連結",
          );
        } catch (error) {
          log.warn(
            `${this._guildId}:${this._channelId} 無法重新連線`,
            "音樂: 連結",
          );
          const disconnecteEmbed = new Discord.EmbedBuilder()
            .setTitle("😕 ┃ 我的語音連接斷開了")
            .setColor(colors.danger);
          this._channel
            .send({
              embeds: [disconnecteEmbed],
            })
            .catch(this.noop);
          this.stop(null, true);
        }
      },
    );
    this._player.once(AudioPlayerStatus.Playing, () => {
      log.info(
        `${this._guildId}:${this._channelId} 音樂播放器進入播放狀態`,
        "音樂: 播放",
      );
    });
    this._player.on(AudioPlayerStatus.Idle, () => {
      log.info(
        `${this._guildId}:${this._channelId} 音樂播放器進入閒置狀態`,
        "音樂: 播放",
      );
      this.handelIdle();
    });
    this._player.on(AudioPlayerStatus.Buffering, () => {
      log.info(
        `${this._guildId}:${this._channelId} 音樂播放器進入緩衝狀態`,
        "音樂: 播放",
      );
    });

    this._init = true;
    this._client.players.set(this._guildId, this);
  }

  async setSpeaker() {
    await entersState(this._connection, VoiceConnectionStatus.Ready);
    this._guild.members.me.voice.setSuppressed(false).catch(() => {
      const notSpeakerEmbed = new Discord.EmbedBuilder()
        .setTitle("🙁 ┃ 我無法變成演講者，可能會無法聽到音樂")
        .setColor(colors.danger);
      this._channel
        .send({
          embeds: [notSpeakerEmbed],
        })
        .catch(this.noop);
    });
  }

  async play(
    track,
    interaction,
    fromSearch = false,
    fromNightcore = false,
  ) {
    let rawData = null;
    let parsedData = null;
    let isFull = null;
    let isPlaylist = false;

    const searchEmbed = new Discord.EmbedBuilder()
      .setTitle(`🔍 ┃ 正在搜尋 **${track}**`)
      .setColor(colors.success);
    if (!fromSearch) {
      interaction
        .editReply({
          embeds: [searchEmbed],
        })
        .catch(this.noop);
    }

    if (
      play.yt_validate(track) !== "video" &&
      !track.startsWith("https")
    ) {
      try {
        const result = await play.search(track, {
          limit: 1,
        });
        rawData = await play.video_info(result[0]?.url);
        if (!rawData) {
          return this._channel.send("Nothing found");
        }
        isFull = false;
      } catch (e) {
        return this.handelYoutubeError(e);
      }
    } else if (play.yt_validate(track) === "video") {
      try {
        rawData = await play.video_info(track);
        isFull = true;
      } catch (e) {
        return this.handelYoutubeError(e);
      }
    } else {
      let videos;
      isPlaylist = true;
      try {
        const playlist = await play.playlist_info(track, {
          incomplete: true,
        });
        videos = await playlist.all_videos();
      } catch (e) {
        return this.handelYoutubeError(e);
      }
      const playlistEmbed = new Discord.EmbedBuilder()
        .setTitle(
          `🔍 ┃ 已加入整個播放清單，共有 **${videos.length}** 首歌曲`,
        )
        .setColor(colors.success);
      interaction
        .followUp({
          embeds: [playlistEmbed],
        })
        .catch(this.noop);

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
          id: play.extractID(video.url),
          isFull: false,
        });
      });
    }
    if (!isPlaylist) {
      parsedData = [
        {
          title: rawData.video_details.title,
          url: rawData.video_details.url,
          duraction: rawData.video_details.durationInSec,
          duractionParsed: rawData.video_details.durationRaw,
          thumbnail: rawData.video_details.thumbnails.pop().url,
          queuer: interaction.user.username,
          id: rawData.video_details.id,
          isFull,
        },
      ];
    }

    if (fromNightcore) this._nightcore = true;

    if (this._songs.length === 0) {
      this._songs.push(...parsedData);
      this.playStream();
    } else {
      this._songs.push(...parsedData);
      const addedEmbed = new Discord.EmbedBuilder()
        .setTitle(`✅ ┃ 成功加入${parsedData.length}首歌曲至播放清單`)
        .setDescription(
          `播放清單內目前有 ${this._songs.length} 首歌曲`,
        )
        .setColor(colors.success);
      if (!fromSearch) {
        interaction
          .followUp({
            embeds: [addedEmbed],
          })
          .catch(this.noop);
      }

      this.updateNoticeEmbed();
      parsedData = null;
    }
  }

  skip(interaction) {
    if (!this._audio?.metadata) {
      const nomusicEmbed = new Discord.EmbedBuilder()
        .setTitle("❌️ ┃ 沒有音樂正在播放")
        .setColor(colors.danger);
      return interaction
        .reply({
          embeds: [nomusicEmbed],
        })
        .catch(this.noop);
    }

    const skipEmbed = new Discord.EmbedBuilder()
      .setTitle(`⏭️ ┃ 跳過歌曲 **${this._audio.metadata.title}**`)
      .setColor(colors.success);
    if (this._paused) this._player.unpause();
    this._paused = false;
    this._player.stop();
    interaction
      .reply({
        embeds: [skipEmbed],
      })
      .catch(this.noop);
  }

  pause(interaction) {
    const pauseEmbed = new Discord.EmbedBuilder()
      .setTitle("⏸️ ┃ 暫停音樂")
      .setColor(colors.success);
    this._paused = true;
    this._player.pause();
    interaction
      .reply({
        embeds: [pauseEmbed],
      })
      .catch(this.noop);
    this.updateNoticeEmbed();
  }

  unpause(interaction) {
    const unpauseEmbed = new Discord.EmbedBuilder()
      .setTitle("▶️ ┃ 繼續播放音樂")
      .setColor(colors.success);
    this._paused = false;
    this._player.unpause();
    interaction
      .reply({
        embeds: [unpauseEmbed],
      })
      .catch(this.noop);
    this.updateNoticeEmbed();
  }

  shuffle(interaction) {
    const shuffled = [].concat(this._songs);
    let currentIndex = this._songs.length;
    let temporaryValue;
    let randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = shuffled[currentIndex];
      shuffled[currentIndex] = shuffled[randomIndex];
      shuffled[randomIndex] = temporaryValue;
    }

    const shuffleEmbed = new Discord.EmbedBuilder()
      .setTitle("🔀 ┃ 重新排序音樂")
      .setColor(colors.success);
    this._songs = shuffled;
    interaction
      .reply({
        embeds: [shuffleEmbed],
      })
      .catch(this.noop);
  }

  async stop(interaction, force = false) {
    const stopEmbed = new Discord.EmbedBuilder()
      .setTitle("⏹️ ┃ 停止播放音樂")
      .setColor(colors.success);
    if (!force) {
      interaction
        .reply({
          embeds: [stopEmbed],
        })
        .catch(this.noop);
    }
    this._songs = [];
    this._stopped = true;
    await this._noticeMessage?.delete().catch(this.noop);
    this._player.stop();
  }

  loop(interaction) {
    const loopEmbed = new Discord.EmbedBuilder().setColor(
      colors.success,
    );
    if (!this._loop) {
      this._loop = true;
      loopEmbed.setTitle("🔁 ┃ 重複播放所有歌曲");
    } else {
      this._loop = false;
      loopEmbed.setTitle("▶ ┃ 取消重複播放所有歌曲");
    }
    this._repeat = false;
    interaction
      .reply({
        embeds: [loopEmbed],
      })
      .catch(this.noop);
    this.updateNoticeEmbed();
  }

  repeat(interaction) {
    const repeatEmbed = new Discord.EmbedBuilder()
      .setTitle("🔂 ┃ 重複播放目前的歌曲")
      .setColor(colors.success);
    if (!this._repeat) {
      this._repeat = true;
      repeatEmbed.setTitle("🔁 ┃ 重複播放目前的歌曲");
    } else {
      this._repeat = false;
      repeatEmbed.setTitle("▶ ┃ 取消重複播放目前的歌曲");
    }
    this._loop = false;
    interaction
      .reply({
        embeds: [repeatEmbed],
      })
      .catch(this.noop);
    this.updateNoticeEmbed();
  }

  nightcore(interaction) {
    const nightcoreEmbed = new Discord.EmbedBuilder().setColor(
      colors.success,
    );
    if (!this._nightcore) {
      this._nightcore = true;
      nightcoreEmbed.setTitle("🌌 ┃ Nightcore!");
      nightcoreEmbed.setDescription(
        "變更會在下一首歌曲套用  注意: Nightcore音效只會在非直播的音樂中作用",
      );
    } else {
      this._nightcore = false;
      nightcoreEmbed.setTitle("🌅 ┃ 已關閉Nightcore音效");
    }
    interaction
      .reply({
        embeds: [nightcoreEmbed],
      })
      .catch(this.noop);
  }

  playnext(interaction, index) {
    const playnextEmbed = new Discord.EmbedBuilder()
      .setTitle(
        `⚡ ┃ ${
          this._songs[index - 1].title
        } 將會在目前歌曲結束後播放`,
      )
      .setColor(colors.blurple);
    this._songs = moveArray(this._songs, index - 1, 1);
    interaction
      .reply({
        embeds: [playnextEmbed],
      })
      .catch(() => {});
  }

  async playStream() {
    if (!this._songs[0]?.isFull) {
      let rawData;
      try {
        rawData = await play.video_info(this._songs[0].url);
      } catch (e) {
        this.handelYoutubeError(e);
        return;
      }

      this._songs[0] = {
        title: rawData.video_details.title,
        url: rawData.video_details.url,
        duraction: rawData.video_details.durationInSec,
        duractionParsed: rawData.video_details.durationRaw,
        thumbnail: rawData.video_details.thumbnails.pop().url,
        queuer: this._songs[0].queuer,
        id: play.extractID(this._songs[0].url),
        isFull: true,
      };

      rawData = null;
    }

    try {
      this._raw = await play.stream(this._songs[0].url);
    } catch (e) {
      this._songs.shift();
      this.handelYoutubeError(e);
      return;
    }

    if (this._raw.type === "opus") {
      if (!this._optimize) {
        this._engines.opusDecoder = new prism.opus.Decoder({
          channels: 2,
          frameSize: 960,
          rate: 48000,
        });
        this._engines.volumeTransform = new VolumeTransformer({
          volume: this._volume,
        });
        if (this._nightcore) {
          this._engines.libsamplerate = new SampleRate({
            type: SampleRate.SRC_SINC_FASTEST,
            channels: 2,
            fromRate: 48000,
            fromDepth: 16,
            toRate: 48000 / 1.15,
            toDepth: 16,
          });
        }
        this._engines.opusEncoder = new prism.opus.Encoder({
          channels: 2,
          frameSize: 960,
          rate: 48000,
        });
      }
      if (this._nightcore && this._engines.libsamplerate) {
        this._encoded = this._raw.stream
          .pipe(this._engines.opusDecoder)
          .pipe(this._engines.volumeTransform)
          .pipe(this._engines.libsamplerate)
          .pipe(this._engines.opusEncoder);
      } else if (!this._optimize) {
        this._encoded = this._raw.stream
          .pipe(this._engines.opusDecoder)
          .pipe(this._engines.volumeTransform)
          .pipe(this._engines.opusEncoder);
      } else {
        this._encoded = this._raw.stream;
      }
    } else if (this._raw.type === "webm/opus") {
      this._engines.webmDemuxer = new prism.opus.WebmDemuxer();
      if (!this._optimize) {
        this._engines.opusDecoder = new prism.opus.Decoder({
          channels: 2,
          frameSize: 960,
          rate: 48000,
        });
        this._engines.volumeTransform = new VolumeTransformer({
          volume: this._volume,
        });
        if (this._nightcore) {
          this._engines.libsamplerate = new SampleRate({
            type: SampleRate.SRC_SINC_FASTEST,
            channels: 2,
            fromRate: 48000,
            fromDepth: 16,
            toRate: 48000 / 1.15,
            toDepth: 16,
          });
        }
        this._engines.opusEncoder = new prism.opus.Encoder({
          channels: 2,
          frameSize: 960,
          rate: 48000,
        });
      }
      if (this._nightcore && this._engines.libsamplerate) {
        this._encoded = this._raw.stream
          .pipe(this._engines.webmDemuxer)
          .pipe(this._engines.opusDecoder)
          .pipe(this._engines.volumeTransform)
          .pipe(this._engines.libsamplerate)
          .pipe(this._engines.opusEncoder);
      } else if (!this._optimize) {
        this._encoded = this._raw.stream
          .pipe(this._engines.webmDemuxer)
          .pipe(this._engines.opusDecoder)
          .pipe(this._engines.volumeTransform)
          .pipe(this._engines.opusEncoder);
      } else {
        this._encoded = this._raw.stream.pipe(
          this._engines.webmDemuxer,
        );
      }
    } else {
      if (!this._optimize) {
        this._engines.ffmpeg = new prism.FFmpeg({
          args: [
            "-analyzeduration",
            "0",
            "-loglevel",
            "0",
            "-f",
            "s16le",
            "-ar",
            "48000",
            "-ac",
            "2",
          ],
        });
        this._engines.volumeTransform = new VolumeTransformer({
          volume: this._volume,
          type: "s16le",
        });
        this._engines.opusEncoder = new prism.opus.Encoder({
          channels: 2,
          frameSize: 960,
          rate: 48000,
        });
      } else {
        this._engines.ffmpeg = new prism.FFmpeg({
          args: [
            "-analyzeduration",
            "0",
            "-loglevel",
            "0",
            "-f",
            "s16le",
            "-ar",
            "48000",
            "-ac",
            "2",
          ],
        });
        this._engines.opusEncoder = new prism.opus.Encoder({
          channels: 2,
          frameSize: 960,
          rate: 48000,
        });
      }
      if (!this._optimize) {
        this._encoded = this._raw.stream
          .pipe(this._engines.ffmpeg)
          .pipe(this._engines.volumeTransform)
          .pipe(this._engines.opusEncoder);
      } else {
        this._encoded = this._raw.stream
          .pipe(this._engines.ffmpeg)
          .pipe(this._engines.opusEncoder);
      }
    }
    this._audio = createAudioResource(this._encoded, {
      inputType: StreamType.Opus,
      metadata: this._songs[0],
    });
    this._player.play(this._audio);

    const playingEmbed = new Discord.EmbedBuilder()
      .setTitle(
        `🕒 正在準備播放 ${this._songs[0]?.title ?? "未知的歌曲"}...`,
      )
      .setColor(colors.warning);

    this._noticeMessage = await this._channel
      .send({
        embeds: [playingEmbed],
      })
      .catch(this.noop);
    this._buttonCollector =
      this._noticeMessage?.createMessageComponentCollector({
        componentType: Discord.ComponentType.Button,
      });

    this.updateNoticeEmbed();

    this._buttonCollector?.on("collect", (interaction) =>
      this.handelButtonClick(interaction),
    );
  }

  async updateNoticeEmbed() {
    const musicButton = new Discord.ButtonBuilder()
      .setCustomId("pause")
      .setEmoji(
        this._paused
          ? "<:play:827734196243398668>"
          : "<:pause:827737900359745586>",
      )
      .setStyle(Discord.ButtonStyle.Primary);
    const skipButton = new Discord.ButtonBuilder()
      .setCustomId("skip")
      .setEmoji("<:skip:827734282318905355>")
      .setStyle(Discord.ButtonStyle.Secondary);
    const stopButton = new Discord.ButtonBuilder()
      .setCustomId("stop")
      .setEmoji("<:stop:827734840891015189>")
      .setStyle(Discord.ButtonStyle.Danger);

    let volDownButton, volUpButton, hintButton;
    if (!this._optimize) {
      volDownButton = new Discord.ButtonBuilder()
        .setCustomId("voldown")
        .setEmoji("<:vol_down_new:1023467938092679168>")
        .setStyle(Discord.ButtonStyle.Success);
      volUpButton = new Discord.ButtonBuilder()
        .setCustomId("volup")
        .setEmoji("<:vol_up_new:1023467776653926450>")
        .setStyle(Discord.ButtonStyle.Success);
      hintButton = new Discord.ButtonBuilder()
        .setCustomId("mute")
        .setEmoji("<:mute_new:1023467867942948934>")
        .setStyle(Discord.ButtonStyle.Success);
    }

    if (this._songs.length <= 1) skipButton.setDisabled(true);

    if (!this._optimize) {
      if (this._volume >= 1 || this._muted) {
        volUpButton.setDisabled(true);
      }
      if (this._volume <= 0 || this._muted) {
        volDownButton.setDisabled(true);
      }
    }

    let rowTwo;
    const rowOne = new Discord.ActionRowBuilder().addComponents(
      musicButton,
      skipButton,
      stopButton,
    );
    if (!this._optimize) {
      // eslint-disable-next-line no-unused-vars
      rowTwo = new Discord.ActionRowBuilder().addComponents(
        volDownButton,
        volUpButton,
        hintButton,
      );
    }

    if (!this._audio?.metadata?.title) return; // Ignore if title is missing

    // Image process
    Canvas.GlobalFonts.registerFromPath(
      join(resolve(), "src", "assets", "notosansTC.otf"),
      "noto",
    );
    Canvas.GlobalFonts.registerFromPath(
      join(resolve(), "src", "assets", "joypixels.ttf"),
      "joypixels",
    );

    const canvas = new Canvas.Canvas(960, 300);
    const ctx = canvas.getContext("2d");
    let bg;
    try {
      const { body } = await request(
        `https://i3.ytimg.com/vi/${this._audio.metadata.id}/maxresdefault.jpg`,
      );
      bg = new Canvas.Image();
      bg.src = Buffer.from(await body.arrayBuffer());
    } catch (e) {
      const { body } = await request(
        "https://raw.githubusercontent.com/blackcatbot/blackcat-app/main/public/unknown.png",
      );
      bg = new Canvas.Image();
      bg.src = Buffer.from(await body.arrayBuffer());
    }
    const percentage =
      Math.round((this.playTime / this.nowplaying.duraction) * 100) /
      100;
    ctx.fillStyle = "#2f3136";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bgData = await imageSize(bg.src);
    const percent = bgData.width / 200;
    const bgHeight = bgData.height / percent;
    const bgWidth = bgData.width / percent;
    ctx.save();
    ctx.drawImage(bg, 50, 40, bgWidth, bgHeight);
    ctx.restore();
    ctx.font = "25px noto";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("正在播放:", bgWidth + 90, 70);
    ctx.font = '50px "noto","joypixels';
    let text = this._audio.metadata.title;
    let textLength = text.length;
    while (
      ctx.measureText(`${text.substring(0, textLength)}...`).width >
      canvas.width - 320
    ) {
      textLength -= 1;
    }
    if (text.length > textLength) {
      text = text.substring(0, textLength) + "...";
    }
    ctx.fillText(text, bgWidth + 90, 145);

    // Line between image and text
    ctx.strokeStyle = "transparent";
    ctx.fillStyle = "#5f636d";
    ctx.beginPath();
    ctx.roundRect(bgWidth + 65, 47, 7, 99, 3.5);
    ctx.closePath();
    ctx.fill();

    // Progress line background
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(50, 200, 860, 10, 5);
    ctx.closePath();
    ctx.fill();

    // Progress bar foreground
    ctx.fillStyle = "#04ECF0";
    ctx.beginPath();
    ctx.roundRect(
      50,
      200,
      (!isFinite(percentage) ? 1 : percentage) * 860,
      10,
      5,
    );
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "20px noto,joypixels";
    const enabledMode = [];

    if (!this._optimize) {
      if (this._muted) enabledMode.push("🔇 靜音");
      else enabledMode.push(`🔊 音量: ${this._volume * 100}%`);
    }
    if (this._loop) enabledMode.push("🔁 循環播放");
    if (this._repeat) enabledMode.push("🔂 重複播放");
    enabledMode.push(`👥 點歌者: ${this._audio.metadata.queuer}`);
    let playtime = new Date(this.playTime * 1000).toISOString();
    if (this.nowplaying.duraction <= 0) playtime = "直播";
    else if (this.nowplaying.duraction < 3600) {
      playtime = playtime.substr(14, 5);
    } else playtime = playtime.substr(11, 8);
    ctx.fillText(
      `${playtime}/${
        this._audio.metadata.duractionParsed
      } | ${enabledMode.join(" | ")}`,
      50,
      250,
    );
    const buffer = canvas.toBuffer("image/png");

    const attachment = new Discord.AttachmentBuilder(buffer, {
      name: `${this._guildId}.png`,
    });

    const playingEmbed = new Discord.EmbedBuilder()
      .setDescription(
        `🎵 ┃ 目前正在播放 [${this._audio.metadata.title}](${this._audio.metadata.url})`,
      )
      .setThumbnail(this._audio.metadata.thumbnail)
      .setImage(`attachment://${this._guildId}.png`)
      .setColor(colors.success);

    if (!this._optimize) {
      if (this._muted) {
        playingEmbed.addFields([
          {
            name: "🔇 ┃ 靜音",
            value: "開啟",
            inline: true,
          },
        ]);
      } else {
        playingEmbed.addFields([
          {
            name: "🔊 ┃ 音量",
            value: `${this._volume * 100}%`,
            inline: true,
          },
        ]);
      }
    }
    if (this._loop) {
      playingEmbed.addFields([
        {
          name: "🔁 ┃ 循環播放",
          value: "開啟",
          inline: true,
        },
      ]);
    }
    if (this._repeat) {
      playingEmbed.addFields([
        {
          name: "🔂 ┃ 重複播放",
          value: "開啟",
          inline: true,
        },
      ]);
    }
    playingEmbed.addFields([
      {
        name: "👥 ┃ 點歌者",
        value: this._audio.metadata.queuer,
        inline: true,
      },
    ]);

    const components = [rowOne];
    if (!this._optimize) components.push(rowTwo);

    await this._noticeMessage
      ?.edit({
        embeds: [playingEmbed],
        components,
        files: [attachment],
      })
      .catch(this.noop);
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
    return this._engines.volumeTransform.volume;
  }

  get pauseState() {
    return this._paused;
  }

  get textChannel() {
    return this._channel;
  }

  get enabledMode() {
    return {
      loop: this._loop,
      repeat: this._repeat,
      mute: this._muted,
    };
  }

  get queuer() {
    return this._audio.metadata.queuer;
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
    this._engines.volumeTransform.setVolume(volume);

    this.updateNoticeEmbed();
  }

  handelYoutubeError(e) {
    if (e.message.includes("confirm your age")) {
      const invaildEmbed = new Discord.EmbedBuilder()
        .setTitle("😱 ┃ 我沒辦法取得你想播放的音樂，因為需要登入帳號")
        .setDescription(
          "錯誤訊息:\n" + "```js" + `${e.message}\n` + "```",
        )
        .setColor(colors.danger);
      this._channel
        .send({
          embeds: [invaildEmbed],
        })
        .catch(this.noop);
    } else if (e.message.includes("429")) {
      const limitEmbed = new Discord.EmbedBuilder()
        .setTitle("😱 ┃ 現在無法取得這個音樂，請稍後再試")
        .setDescription(
          "錯誤訊息:\n" + "```js\n" + `${e.message}\n` + "```",
        )
        .setColor(colors.danger);
      this._channel
        .send({
          embeds: [limitEmbed],
        })
        .catch(this.noop);
    } else if (e.message.includes("private")) {
      const privateEmbed = new Discord.EmbedBuilder()
        .setTitle("😱 ┃ 這是私人影片")
        .setDescription(
          "錯誤訊息:\n" + "```js\n" + `${e.message}\n` + "```",
        )
        .setColor(colors.danger);
      this._channel
        .send({
          embeds: [privateEmbed],
        })
        .catch(this.noop);
    } else {
      const errorEmbed = new Discord.EmbedBuilder()
        .setTitle("😱 ┃ 發生了未知的錯誤!")
        .setDescription(
          "錯誤訊息:\n" + "```js\n" + `${e.message}\n` + "```",
        )
        .setColor(colors.danger);
      this._channel
        .send({
          embeds: [errorEmbed],
        })
        .catch(this.noop);
    }
    log.error(e.message, e, "音樂");
  }

  handelIdle() {
    if (!this._stopped) {
      this._noticeMessage?.delete().catch(this.noop);
    }

    const playedSong = this._songs.shift();
    if (this._loop && playedSong) this._songs.push(playedSong);
    if (this._repeat && playedSong) this._songs.unshift(playedSong);
    this._noticeMessage?.delete().catch(() => {});
    this._noticeMessage = null;

    try {
      this._encoded?.destroy();
      this._raw?.stream?.destroy();
      this._engines.volumeTransform?.destroy();
      this._engines.opusDecoder?.destroy();
      this._engines.opusEncoder?.destroy();
      this._engines.webmDemuxer?.destroy();
      this._engines.ffmpeg?.destroy();
      this._engines.libsamplerate?.destroy();
      // eslint-disable-next-line no-empty
    } catch {}
    this._engines = {
      opusDecoder: null,
      opusEncoder: null,
      webmDemuxer: null,
      ffmpeg: null,
      volumeTransform: null,
      libsamplerate: null,
    };
    this._raw.stream.destroy();
    this._raw.stream.read(); // Drain the data

    this._audio = null;
    this._encoded = null;
    this._raw = null;

    if (this._songs.length === 0) {
      const endEmbed = new Discord.EmbedBuilder()
        .setTitle("👌 ┃ 序列裡的歌曲播放完畢")
        .setColor(colors.success);
      if (!this._guildDeleted) {
        this._channel
          .send({
            embeds: [endEmbed],
          })
          .catch(this.noop);
      }
      this._client.players.delete(this._guildId);
      try {
        this._connection.destroy();
        // eslint-disable-next-line no-empty
      } catch (e) {}

      this.cleanup();
    } else {
      this.playStream();
    }
  }

  async handelButtonClick(interaction) {
    if (!allowModify(interaction)) {
      return interaction
        .reply({
          content: "❌ ┃ 你必須跟我在同一個頻道裡!",
          ephemeral: true,
        })
        .catch(this.noop);
    }

    let replyMessage = "";
    let isUpdateRequired = true;
    switch (interaction.customId) {
      case "pause":
        if (this._paused) {
          this._player.unpause();
          this._paused = false;
          replyMessage = "▶️ ┃ 繼續播放音樂";
        } else if (!this._paused) {
          this._player.pause();
          this._paused = true;
          replyMessage = "⏸️ ┃ 暫停播放音樂";
        }
        break;
      case "skip":
        if (this._paused) this._player.unpause();
        this._paused = false;
        this._player.stop();
        replyMessage = "⏭️ ┃ 跳過音樂";
        break;
      case "stop":
        this._songs = [];
        this._stopped = true;
        this._buttonCollector?.stop();
        replyMessage = "⏹️ ┃ 停止播放音樂";
        await this._noticeMessage?.delete().catch(this.noop);
        this._player.stop();
        isUpdateRequired = false;
        break;
      case "volup":
        this.volume = parseFloat((this._volume + 0.1).toFixed(10));
        replyMessage = `🔊 ┃ 音量增加10%, 目前音量為 ${
          this._volume * 100
        }%`;
        break;
      case "voldown":
        this.volume = parseFloat((this._volume - 0.1).toFixed(10));
        replyMessage = `🔊 ┃ 音量減少10%, 目前音量為 ${
          this._volume * 100
        }%`;
        break;
      case "mute":
        if (this._muted) {
          this._engines.volumeTransform.setVolume(this._volume);
          this._muted = false;
          replyMessage = `🔊 ┃ 音量恢復至${this._volume * 100}%`;
        } else {
          this._engines.volumeTransform.setVolume(0);
          this._muted = true;
          replyMessage = "🔇 ┃ 靜音音樂";
        }
        break;
      default:
        interaction.reply("❌ ┃ 發生了一些錯誤");
        return;
    }
    const clickEmbed = new Discord.EmbedBuilder()
      .addFields([{ name: replyMessage, value: "\u200b" }])
      .setFooter({
        text: interaction.user.username,
        iconURL: interaction.user.avatarURL({
          dynamic: true,
        }),
      })
      .setColor(colors.success);
    interaction
      .reply({
        embeds: [clickEmbed],
      })
      .catch(this.noop);
    setTimeout(() => {
      interaction.deleteReply().catch(this.noop);
    }, 15_000);

    if (isUpdateRequired) this.updateNoticeEmbed();
  }

  cleanup() {
    this._client = null;
    this._channel = null;
    this._guild = null;
    this._guildId = null;
    this._voiceChannel = null;
    this._channelId = null;
    this._optimize = null;
    this._init = null;
    this._paused = null;
    this._muted = null;
    this._loop = null;
    this._repeat = null;
    this._nightcore = null;
    this._guildDeleted = null;
    this._stopped = null;
    this._volume = null;
    this._noticeMessage = null;
    this._buttonCollector = null;
    this._nowplaying = null;
    this._songs = null;
    this._engines = null;
    this._encoded = null;
    this._raw = null;
  }
}
