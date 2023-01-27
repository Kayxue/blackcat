import PlayerManager from "../audio/PlayerManager.js";
import { blurple, danger } from "../color.js";
import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  InteractionCollector,
  ButtonStyle,
  ComponentType,
  InteractionType,
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
      return interaction
        .reply("❌ ┃ 必須要有音樂正在播放")
        .catch(() => {});
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
    }

    if (player.songs.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setTitle("❌ ┃ 播放序列為空")
        .setColor(danger);
      return interaction
        .reply({ embeds: [emptyEmbed] })
        .catch(() => {});
    }
    const songs = player.songs.slice(0);

    const parsedSongs = [];
    const embeds = [];
    let currentPage = 0;
    while (songs.length) {
      parsedSongs.push(songs.splice(0, 10));
    }
    parsedSongs.forEach((songList, pageIndex) => {
      const embedPage = new EmbedBuilder()
        .setTitle(
          `🎵 ┃ 音樂序列 <第${pageIndex + 1}/${
            parsedSongs.length
          }頁>`,
        )
        .setColor(blurple);
      songList.forEach((song, songIndex) => {
        embedPage.addFields([
          {
            name: `[${pageIndex * 10 + songIndex + 1}] ${song.title}`,
            value: `${
              song.duractionParsed ?? "未知的長度"
            } / [YouTube](${song.url}])`,
          },
        ]);
      });
      embeds.push(embedPage);
    });
    const previousBtn = new ButtonBuilder()
      .setCustomId("previous")
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);
    const nextBtn = new ButtonBuilder()
      .setCustomId("next")
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Primary);
    const closeBtn = new ButtonBuilder()
      .setCustomId("close")
      .setEmoji("❎")
      .setStyle(ButtonStyle.Danger);

    if (embeds.length - 1 === 0) nextBtn.setDisabled(true);
    let buttons = new ActionRowBuilder().setComponents(
      previousBtn,
      closeBtn,
      nextBtn,
    );

    let queueMessage;
    try {
      queueMessage = await interaction.reply({
        embeds: [embeds[currentPage]],
        components: [buttons],
        fetchReply: true,
      });
    } catch (e) {
      return;
    }

    const collector = new InteractionCollector(interaction.client, {
      componentType: ComponentType.Button,
      interactionType: InteractionType.MessageComponent,
      idle: 15_000,
      message: queueMessage,
    });
    collector.on("collect", (collected) => {
      if (collected.user.id !== interaction.user.id) {
        return interaction.followUp({
          content: "😐 ┃ 這個按鈕不是給你點的",
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
          buttons = new ActionRowBuilder().setComponents(
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
          buttons = new ActionRowBuilder().setComponents(
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
      const endEmbed = new EmbedBuilder()
        .setTitle("💤 ┃ 已關閉")
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
