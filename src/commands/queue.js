import PlayerManager from "../audio/PlayerManager.js";
import { blurple, danger } from "../color.js";
import {
  MessageEmbed,
  MessageButton,
  MessageActionRow,
  InteractionCollector,
} from "discord.js";

export default {
  data: {
    name: "queue",
    description: "顯示播放序列",
  },
  run: async function (interaction) {
    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      return interaction.reply("❌ 必須要有音樂正在播放");
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
    }
    let songs = player.songs;

    let parsedSongs = [],
      embeds = [],
      currentPage = 0;
    while (songs.length) {
      parsedSongs.push(songs.splice(0, 10));
    }
    parsedSongs.forEach((songList, pageIndex) => {
      let embedPage = new MessageEmbed()
        .setTitle(
          `🎵 音樂序列 | 第${pageIndex + 1}/${parsedSongs.length}頁`,
        )
        .setColor(blurple);
      songList.forEach((song, songIndex) => {
        embedPage.addField(
          `[${pageIndex * 10 + songIndex + 1}] ${song.title}`,
          `${song.duractionParsed ?? "未知的長度"} / [YouTube](${
            song.url
          })`,
        );
      });
      embeds.push(embedPage);
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
      .setCustomId("close")
      .setEmoji("❎")
      .setStyle("DANGER");

    if (embeds.length - 1 === 0) nextBtn.setDisabled(true);
    let buttons = new MessageActionRow().setComponents(
      previousBtn,
      closeBtn,
      nextBtn,
    );

    let queueMessage;
    try {
      queueMessage = await interaction.reply({
        embeds: [embeds[currentPage]],
        components: [buttons],
      });
    } catch (e) {
      return;
    }

    let collector = new InteractionCollector(interaction.client, {
      componentType: "BUTTON",
      interactionType: "MESSAGE_COMPONENT",
      idle: 15_000,
      message: queueMessage,
    });
    collector.on("collect", (collected) => {
      if (collected.user.id !== interaction.user.id) {
        return collected.followUp({
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
        case "close":
          collector.stop();
      }
    });
    collector.on("end", () => {
      let endEmbed = new MessageEmbed()
        .setTitle("💤 已關閉")
        .setColor(danger);
      interaction
        .editReply({
          embeds: [endEmbed],
          components: [],
        })
        .catch(() => {});
    });
  },
};
