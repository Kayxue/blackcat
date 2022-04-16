import Together from "discord-together";
import { blurple, danger } from "../color.js";
import {
  MessageEmbed,
  MessageButton,
  MessageActionRow,
  MessageSelectMenu,
  InteractionCollector,
} from "discord.js";

export default {
  data: {
    name: "activity",
    description: "建立一個語音頻道活動",
  },
  run: function (interaction) {
    if (!interaction.member.voice.channel?.id) {
      let vcEmbed = new MessageEmbed()
        .setTitle("❌ 您必須在語音頻道內")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [vcEmbed],
        })
        .catch(() => {});
    }

    let selectEmbed = new MessageEmbed()
      .setTitle("🚩 活動列表")
      .setDescription("請選擇您要建立的活動")
      .setColor(blurple);
    let selectMenu = new MessageSelectMenu()
      .setCustomId("activity")
      .addOptions([
        {
          label: "YouTube Together",
          value: "youtube",
        },
        {
          label: "撲克之夜 (Poker Night)",
          value: "poker",
        },
        {
          label: "西洋棋 (Chess In The Park)",
          value: "chess",
        },
        {
          label: "公園跳棋 (Checkers In The Park)",
          value: "checkers",
        },
        {
          label: "我們之間 (Betrayal.io)",
          value: "betrayal",
        },
        {
          label: "釣魚村落 (Fishington)",
          value: "fishington",
        },
        {
          label: "文字方塊 (Letter Tile)",
          value: "lettertile",
        },
        {
          label: "單字零食 (Words Snack)",
          value: "wordsnack",
        },
        {
          label: "你話我猜",
        },
      ]);
  },
};
