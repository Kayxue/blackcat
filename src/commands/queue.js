import PlayerManager from "../audio/PlayerManager.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { blurple } from "../color.js";
import {
  MessageEmbed,
  MessageButton,
  MessageActionRow,
  InteractionCollector
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("顯示播放序列"),
  run: async function(interaction) {
    let player;
    console.log(interaction);
    if (!PlayerManager.getSendingPlayer(interaction.guild.id)) {
      return interaction.reply("❌ 必須要有音樂正在播放");
    }
    let songs = player.songs;

    let parsedSongs = [],
      embeds = [],
      currentPage = 0;
    while (songs.length) {
      parsedSongs.push(songs.splice(0, 10))
    }
    parsedSongs.forEach((songList, pageIndex) => {
      let embedPage = new MessageEmbed()
        .setTitle(`🎵 音樂序列 | 第${pageIndex + 1}/${parsedSongs.length}頁`)
        .setColor(blurple)
      songList.forEach((song, songIndex) => {
        embedPage.addField({
          title: `[${pageIndex * 10 + songIndex + 1}] ${song.title}`,
          value: `${song.duractionParsed} / [YouTube](${song.url})`
        })
      })
      embeds.push(embedPage);
    })
    let previousBtn = new MessageButton()
      .setCustomId("previous")
      .setemoji("◀️")
      .setStyle("PRIMARY")
      .setDisabled(true);
    let nextBtn = new MessageButton()
      .setCustomId("next")
      .setemoji("▶️")
      .setStyle("PRIMARY")
    let closeBtn = new MessageButton()
      .setCustomId("close")
      .setemoji("❎")
      .setStyle("DANGER");

    if (embeds.length - 1 === 0)
      nextBtn.setDisabled(true);
    let buttons = new MessageActionRow()
      .setComponents(previousBtn, closeBtn, nextBtn);

    let queueMessage
    try {
      queueMessage = await interaction.reply({
        embeds: [embeds[currentPage]],
        components: buttons
      });
    } catch (e) { return }

    let collector = new InteractionCollector(interaction.client, {
      componentType: "BUTTON",
      interactionType: "MESSAGE_COMPONENT",
      idle: 15_000,
      message: queueMessage
    });
    collector.on("collect", (collected) => {
      if (collected.user.id !== interaction.user.id) {
        return collected.reply({
          content: "😐 這個按鈕不是給你點的",
          ephemeral: true
        });
      }
      switch (collected.customId) {
        case "previous":
          currentPage -= 1;
          if (currentPage <= 1) {
            previousBtn.setDisabled(true);
            currentPage = 1;
          }
          buttons = new MessageActionRow()
            .setComponents(previousBtn, closeBtn, nextBtn);

          collected.update({
            embeds: [embeds[currentPage]],
            components: [buttons]
          }).catch(() => {});
          break;
      }
    })
  },
};