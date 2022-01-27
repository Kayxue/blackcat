const {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnectionStatus,
} = require("@discordjs/voice");
const Discord=require("discord.js"),{ Collection, CommandInteraction } = require("discord.js");
const play = require("play-dl");
const log = require("../logger.js");
const colors = require("../color.json");
const chalk = require("chalk");

module.exports = class Player {
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {*} guild 
     * @param {*} voiceChannel 
     */
    constructor(interaction, guild, voice) {
        this._interaction = interaction;
        this._client = interaction.client;
        this._channel = interaction.channel;
        this._guild = guild;
        this._guildName = guild.name;
        this._guildId = guild.id;
        this._voiceChannel = voice;
        this._channelId = voice.id;
        this._channelName = voice.name;
        this._interactionUsed=false; //創建player時使用的interaction是否已經被reply

        this._init = false;
        this._noticeMessage = null;
        this._nowplaying = null;
        this._songs = [];
    }
    loop() {}

    init() {
        if (this._init) return;
        try {
            this._connection = joinVoiceChannel({
                guildId: this._guildId,
                channelId: this._channelId,
                adapterCreator: this._guild.voiceAdapterCreator,
            });
        } catch (e) {
            log.error(e.message);
            let errorEmbed = new Discord.MessageEmbed()
                .setTitle("🙁 加入語音頻道時發生錯誤")
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
        this._player = createAudioPlayer();
        this._connection.subscribe(this._player);

        this._connection.on(VoiceConnectionStatus.Ready, () => {
            const status = chalk.blue("預備");
            log.info(
                `${this._guildName}:${this._channelName} | 已進入 ${status} 狀態`,
            );
        });
        this._connection.on(
            VoiceConnectionStatus.Disconnected,
            async (oldState, newState) => {
                log.warn(
                    `${this._guildName}:${this._channelName} | 語音斷開連結`,
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
                        `${this._guildName}:${this._channelName} | 重新連接成功`,
                    );
                } catch (error) {
                    log.warn(
                        `${this._guildName}:${this._channelName} | 無法重新連線`,
                    );
                    let disconnecteEmbed = new Discord.MessageEmbed()
                        .setTitle("😕 我的語音連接斷開了")
                        .setColor(colors.danger);
                    this._channel
                        .send({
                            embeds: [disconnecteEmbed],
                        })
                        .catch(this.noop);
                    this._connection.destroy();
                }
            },
        );
        this._player.on(AudioPlayerStatus.Idle, () => {
            const status = chalk.blue("閒置");
            log.info(
                `${this._guildName}:${this._channelName} | 音樂播放器進入 ${status} 狀態`,
            );
            this.handelIdle();
        });
        this._player.on(AudioPlayerStatus.Buffering, () => {
            const status = chalk.blue("緩衝");
            log.info(
                `${this._guildName}:${this._channelName} | 音樂播放器進入 ${status} 狀態`,
            );
        });
        this._init = true;
    }

    /**
     * @param {String} track
     */
    async play(track,interaction) {//interaction參數：選用
        let rawData,
            parsedData,
            isPlaylist = false;
        if (play.yt_validate(track) !== "video" && !track.startsWith("https")) {
            try {
                let result = await play.search(track, {
                    limit: 1,
                });
                rawData = await play.video_info(result[0].url);
                if (!rawData) {
                    return this._channel.send("Nothing found");
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
                    rawData: video,
                });
            });
        }
        if (!isPlaylist)
            parsedData = [
                {
                    title: rawData.video_details.title,
                    url: rawData.video_details.url,
                    duraction: rawData.video_details.durationInSec,
                    duractionParsed: rawData.video_details.durationRaw,
                    thumbnail: rawData.video_details.thumbnails.pop().url,
                    rawData,
                },
            ];

        if (this._songs.length === 0) {
            this._songs.push(...parsedData);
            this.playStream();
        } else {
            this._songs.push(...parsedData);
            const addToQueueEmbed=new Discord.MessageEmbed().setTitle(`已成功將"${parsedData[0].title}"加入播放清單`)
            interaction.editReply({embeds:[addToQueueEmbed]})
        }

        this._player.once(AudioPlayerStatus.Playing, () => {
            const status = chalk.blue("播放");
            log.info(
                `${this._guildName}:${this._channelName} | 的音樂播放器進入 ${status} 狀態`,
            );
            this.handelPlaying();
        });
    }

    skip(interaction) {
        this._player.stop();
        let pauseEmbed = new Discord.MessageEmbed().setTitle("跳過音樂");
        interaction.reply({ embeds: [pauseEmbed] });
    }

    pause(interaction) {
        this._player.pause();
        let pauseEmbed = new Discord.MessageEmbed().setTitle("⏸️ 暫停音樂");
        interaction.reply({ embeds: [pauseEmbed] });
    }

    unpause(interaction) {
        this._player.unpause();
        let resumeEmbed = new Discord.MessageEmbed().setTitle("播放音樂");
        interaction.reply({ embeds: [resumeEmbed] });
    }

    async playStream() {
        if (!this._songs[0]?.rawData.full) {
            try {
                this._songs[0].rawData = await play.video_info(
                    this._songs[0].url,
                );
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
                    "載入音樂時發生了一點小錯誤...\n" +
                        "錯誤內容:\n" +
                        "```\n" +
                        e.message +
                        "\n```",
                )
                .setColor(colors.danger);
            this._channel.send({
                embeds: [embed],
            });
            return;
        }
        this._audio = createAudioResource(stream.stream, {
            inputType: stream.type,
            metadata: this._songs[0],
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
            let endEmbed = new Discord.MessageEmbed().setTitle(
                "👌 序列裡的歌曲播放完畢",
            );
            this._channel
                .send({
                    embeds: [endEmbed],
                })
                .catch(this.noop);
        } else {
            this.playStream();
        }
    }

    async handelPlaying() {
        let playingEmbed = new Discord.MessageEmbed()
            .setTitle(`🎵 目前正在播放 \n ${this._audio.metadata.title}`)
            .setURL(this._audio.metadata.url)
            .setThumbnail(this._audio.metadata.thumbnail)
            .setColor(colors.success);

        if(this._interactionUsed){
            this._noticeMessage = await this._channel
            .send({
                embeds: [playingEmbed],
            })
            .catch(this.noop);
        }else{
            this._noticeMessage = await this._interaction
            .editReply({
                embeds: [playingEmbed],
            })
            .catch(this.noop);
            this._interactionUsed=true;
        }
    }
};
