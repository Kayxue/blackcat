import log from "../logger.js";
import {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  ButtonStyle,
} from "discord.js";
import { danger } from "../color.js";

export default {
  event: "interactionCreate",
  once: false,
  run: async (_client, interaction) => {
    if (!interaction.isCommand()) return;

    if (!interaction.guild) {
      let guildEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 你必須把我邀請進一個伺服器裡！")
        .setDescription(
          "你沒辦法在私訊中使用黑貓，必須要在一個伺服器裡使用黑貓。\n" +
            "您可以點擊底下的按鈕來邀請黑貓進伺服器",
        )
        .setColor(danger);
      let inviteButton = new MessageButton()
        .setLabel("邀請黑貓")
        .setStyle(ButtonStyle.Link)
        .setURL(
          "https://discord.com/oauth2/authorize?client_id=848006097197334568&permissions=415776501073&scope=applications.commands%20bot",
        );
      let buttonRow = new MessageActionRow().addComponents(
        inviteButton,
      );
      return interaction
        .reply({
          embeds: [guildEmbed],
          components: [buttonRow],
        })
        .catch(() => {});
    }
    if (!interaction.channel)
      return interaction.reply("❌ ┃ 無法取得文字頻道");
    const command = interaction.client.commands.get(
      interaction.commandName,
    );

    if (!command) {
      let notfoundEmbed = new MessageEmbed()
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
      let errorEmbed = new MessageEmbed()
        .setTitle("🙁 ┃ 執行指令時出現錯誤")
        .addField(
          "️⚠️ ┃  錯誤內容:",
          "```js\n" + `${error.message}\n` + "```",
        )
        .addField("🗨️ ┃ 指令內容", interaction.commandName)
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

      log.error(error.message, error);
    }
  },
};
