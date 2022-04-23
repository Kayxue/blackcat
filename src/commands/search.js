import play from "play-dl";
import log from "../logger.js";
import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import color from "../color.js";
import {
  MessageEmbed,
  MessageButton,
  MessageActionRow,
  InteractionCollector,
} from "discord.js";

export default {
  data: {
    name: "search",
    description: "搜尋音樂",
    options: [
      {
        type: 3, //STRING
        name: "query",
        description: "YouTube上的音樂名稱",
        required: true,
      },
    ],
  },
  run: async function (interaction) {
    if (!interaction.member.voice?.channel) {
      let joinVCEmbed = new MessageEmbed()
        .setTitle("❌ 你必須先在語音頻道內")
        .setColor(color.danger);
      return interaction
        .reply({
          embeds: [joinVCEmbed],
        })
        .catch(() => {});
    }

    if (!interaction.member.voice.channel.joinable)
      return interaction
        .reply("❌ 我無法連線至語音頻道!")
        .catch(() => {});

    const query = interaction.options.getString("query");
    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      player = PlayerManager.createSendingPlayer(interaction);
      player.init();
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
      if (!allowModify(interaction))
        return interaction
          .reply("❌ 你必須跟我在同一個頻道")
          .catch(() => {});
    }

    if (
      play.yt_validate(query) === "video" &&
      query.startsWith("https://")
    ) {
      let videoEmbed = new MessageEmbed()
        .setTitle(
          `🤔 ${interaction.user.username}，您是不是要播放這個影片?`,
        )
        .setDescription(
          `偵測到您輸入的搜尋字串是YouTube影片連結，是否要播放?\n搜尋字串: ${query}`,
        )
        .setFooter({
          text: "請點選以下的按鈕，如果在15秒內沒有回應，則會搜尋此字串",
        })
        .setColor(color.warning);

      let yesBtn = new MessageButton()
        .setEmoji("✅")
        .setLabel("播放這個歌曲")
        .setCustomId("yes");
      let noBtn = new MessageButton()
        .setEmoji("❌")
        .setLabel("不要播放這個歌曲")
        .setCustomId("no");
      let actionRow = new MessageActionRow().addComponents(
        yesBtn,
        noBtn,
      );

      let selectMessage;
      try {
        selectMessage = await interaction
          .reply({
            embeds: [videoEmbed],
            components: [actionRow],
            fetchReply: true,
          })
          .catch(() => {});
      } catch (e) {
        return;
      }

      let selected;
      try {
        selected = selectMessage.awaitMessageComponent({
          time: 15_000,
          filter: (btnInteraction) =>
            btnInteraction.user.id === interaction.user.id,
        });
        // eslint-disable-next-line no-empty
      } catch (e) {}

      if (selected) {
        if (selected.customId === "yes") {
          player.play(query, interaction, true);
          let playEmbed = new MessageEmbed()
            .setTitle("🎶 已將歌曲加入播放序列中")
            .setDescription(`歌曲網址: ${query}`)
            .setColor(color.success);
          interaction.reply({ embeds: [playEmbed] }).catch(() => {});
          return;
        }
      }
    }

    let searchEmbed = new MessageEmbed()
      .setTitle(`🔍 正在搜尋 **${query}**`)
      .setColor(color.success);
    interaction
      .reply({
        embeds: [searchEmbed],
      })
      .catch(() => {});

    let result;
    try {
      result = await play.search(query, {
        source: {
          youtube: "video",
        },
        limit: 10,
      });
    } catch (e) {
      if (e.message.includes("confirm your age")) {
        let invaildEmbed = new MessageEmbed()
          .setTitle("😱 我沒辦法取得你想播放的音樂，因為需要登入帳號")
          .setDescription(
            "錯誤訊息:\n" + "```js" + `${e.message}\n` + "```",
          )
          .setColor(color.danger);
        this._channel
          .send({
            embeds: [invaildEmbed],
          })
          .catch(this.noop);
      } else if (e.message.includes("429")) {
        let limitEmbed = new MessageEmbed()
          .setTitle("😱 現在無法取得這個音樂，請稍後再試")
          .setDescription(
            "錯誤訊息:\n" + "```js\n" + `${e.message}\n` + "```",
          )
          .setColor(color.danger);
        this._channel
          .send({
            embeds: [limitEmbed],
          })
          .catch(this.noop);
      } else if (e.message.includes("private")) {
        let privateEmbed = new MessageEmbed()
          .setTitle("😱 這是私人影片")
          .setDescription(
            "錯誤訊息:\n" + "```js\n" + `${e.message}\n` + "```",
          )
          .setColor(color.danger);
        this._channel
          .send({
            embeds: [privateEmbed],
          })
          .catch(this.noop);
      } else {
        let errorEmbed = new MessageEmbed()
          .setTitle("😱 發生了未知的錯誤!")
          .setDescription(
            "錯誤訊息:\n" + "```js\n" + `${e.message}\n` + "```",
          )
          .setColor(color.danger);
        this._channel
          .send({
            embeds: [errorEmbed],
          })
          .catch(this.noop);
      }
      log.error(e.message, e);

      return;
    }

    let embeds = [];

    result.forEach((video) => {
      let videoEmbed = new MessageEmbed()
        .setTitle(`🎶 ${video.title}`)
        .setDescription(
          `頻道: ${video.channel?.name || "未知的上傳者"}\n${
            video.durationRaw
          }`,
        )
        .setThumbnail(video.thumbnails[0].url)
        .setURL(video.url)
        .setColor(color.success)
        .setFooter({
          text: "請點選以下的按鈕，如果在15秒內沒有回應，則會關閉搜尋",
        });

      embeds.push(videoEmbed);
    });

    let previousBtn = new MessageButton()
      .setCustomId("previous")
      .setEmoji("◀️")
      .setStyle("PRIMARY")
      .setDisabled(true);
    let nextBtn = new MessageButton()
      .setCustomId("next")
      .setEmoji("▶️")
      .setStyle("PRIMARY");
    let closeBtn = new MessageButton()
      .setCustomId("choose")
      .setEmoji("✅")
      .setStyle("DANGER");

    if (embeds.length - 1 === 0) nextBtn.setDisabled(true);
    let buttons = new MessageActionRow().setComponents(
      previousBtn,
      closeBtn,
      nextBtn,
    );

    let searchMessage,
      currentPage = 0;
    try {
      searchMessage = await interaction.editReply({
        embeds: [embeds[currentPage]],
        components: [buttons],
      });
    } catch (e) {
      return;
    }

    let collector = new InteractionCollector(interaction.client, {
      interactionType: "MESSAGE_COMPONENT",
      idle: 15_000,
      message: searchMessage,
      componentType: "BUTTON",
    });

    collector.on("collect", (collected) => {
      if (collected.user.id !== interaction.user.id) {
        return interaction.followUp({
          content: "😐 這個按鈕不是給你點的",
          ephemeral: true,
        });
      }

      switch (collected.customId) {
        case "previous":
          currentPage -= 1;
          if (currentPage <= 1) {
            previousBtn.setDisabled(true);
            currentPage = 1;
            nextBtn.setDisabled(false);
          } else {
            previousBtn.setDisabled(false);
            nextBtn.setDisabled(false);
          }
          buttons = new MessageActionRow().setComponents(
            previousBtn,
            closeBtn,
            nextBtn,
          );

          collected
            .update({
              embeds: [embeds[currentPage]],
              components: [buttons],
            })
            .catch(() => {});
          break;
        case "next":
          currentPage += 1;
          if (currentPage >= embeds.length) {
            nextBtn.setDisabled(true);
            currentPage = embeds.length;
            previousBtn.setDisabled(false);
          } else {
            previousBtn.setDisabled(false);
            nextBtn.setDisabled(false);
          }
          buttons = new MessageActionRow().setComponents(
            previousBtn,
            closeBtn,
            nextBtn,
          );

          collected
            .update({
              embeds: [embeds[currentPage]],
              components: [buttons],
            })
            .catch(() => {});
          break;
        case "choose":
          collector.stop("choosen");
          player.play(result[currentPage].url, interaction, true);
      }
    });

    collector.on("end", (_collected, reason) => {
      if (reason !== "choosen") {
        interaction.editReply({
          content: "😐 搜尋已取消",
        });
      }
    });
  },
};
