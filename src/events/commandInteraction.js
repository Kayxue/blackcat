import log from "../logger.js";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionType,
} from "discord.js";
import { danger } from "../color.js";

export default {
  event: "interactionCreate",
  once: false,
  run: async (_client, interaction) => {
    if (interaction.type !== InteractionType.ApplicationCommand) {
      return;
    }

    if (!interaction.guild) {
      const guildEmbed = new EmbedBuilder()
        .setTitle("❌ ┃ 你必須把我邀請進一個伺服器裡！")
        .setDescription(
          "你沒辦法在私訊中使用黑貓，必須要在一個伺服器裡使用黑貓。\n" +
            "您可以點擊底下的按鈕來邀請黑貓進伺服器",
        )
        .setColor(danger);
      const inviteButton = new ButtonBuilder()
        .setLabel("邀請黑貓")
        .setStyle(ButtonStyle.Link)
        .setURL(
          "https://discord.com/oauth2/authorize?client_id=848006097197334568&permissions=415776501073&scope=applications.commands%20bot",
        );
      const buttonRow = new ActionRowBuilder().addComponents(
        inviteButton,
      );
      return interaction
        .reply({
          embeds: [guildEmbed],
          components: [buttonRow],
        })
        .catch(() => {});
    }
    if (!interaction.channel) {
      return interaction.reply("❌ ┃ 無法取得文字頻道");
    }
    const command = interaction.client.commands.get(
      interaction.commandName,
    );

    if (!command) {
      const notfoundEmbed = new EmbedBuilder()
        .setTitle(`🤔 ┃ 找不到名為${interaction.commandName}的指令`)
        .setColor(danger);
      return interaction
        .reply({
          embeds: [notfoundEmbed],
        })
        .catch(() => {});
    }

    try {
      command.run(interaction);
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setTitle("🙁 ┃ 執行指令時出現錯誤")
        .addFields([
          {
            name: "️⚠️ ┃  錯誤內容:",
            value: "```js\n" + `${error.message}\n` + "```",
          },
          {
            name: "🗨️ ┃ 指令內容",
            value: interaction.commandName,
          },
        ])
        .setTimestamp()
        .setColor(danger);
      if (interaction.replied) {
        interaction.channel
          .send({
            embeds: [errorEmbed],
          })
          .catch(() => {});
      } else {
        interaction
          .reply({
            embeds: [errorEmbed],
          })
          .catch(() => {});
      }

      log.error(error.message, error, "接收");
    }
  },
};
