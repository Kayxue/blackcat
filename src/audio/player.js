const {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const Discord = require("discord.js");
const play = require("play-dl");
const log = require("../logger.js");

class player {
  constructor(event, guild, voice) {
    this._client = event.client;
    this._channel = event.channel;
    this._guild = guild;
    this._guildId = guild.id;
    this._voiceChannel = voice;
    this._channelId = voice.id;

    this._init = false;
  }

  static getSendingPlayer(guild) {
    return guild.client.players.get(guild.id);
  }

  init() {
    this._connection = joinVoiceChannel({
      guildId: this._guildId,
      channelId: this._channelId,
      adapterCreator: this._guide.voiceAdapterCreator
    });
    this._player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior
      }
    });
    
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
        this.connection.destroy();
      }
    });
  }
  
  async play(track) {
    let url = track;
    if (await play.validate(track) !== "yt_video") {
      try {
        url = await play.search(track, {
          limit: 1
        })[0].url;
      } catch (e) {
        this._channel.send(e.message);
        log.error(e.message);
      }
    }
    let stream = await play.stream(url);
    let audioResource = voice.createAudioResource(stream.stream, {
      type: stream.type
    });
    this._player.play(audioResource);
    this._channel.send("s stt");
  }
}