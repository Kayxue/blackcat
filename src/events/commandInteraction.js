import log from "../logger.js";
import { MessageEmbed } from "discord.js";
import { danger } from "../color.js";

export default {
  event: "interactionCreate",
  once: false,
  run: async (_client, interaction) => {
    if (!interaction.isCommand()) return;
    
    if (interaction.member.bot) return interaction.reply("🤖 請完成\"我不是機器人\"驗證");
    if (!interaction.guild) return interaction.reply("❌ 你必須把我加到一個伺服器裡!");
    if (!interaction.channel) return interaction.reply("❌ 無法取得文字頻道");
    const command = interaction.client.commands.get(interaction.commandName);
  
    if (!command) {
      let notfoundEmbed = new MessageEmbed()
        .setTitle(`🤔 找不到名為${interaction.commandName}的指令`)
        .setColor(danger);
      return interaction.reply({
        embeds: [notfoundEmbed]
      }).catch(() => {});
    }

    try {
      command.run(interaction);
    } catch (error) {
      let errorEmbed = new MessageEmbed()
        .setTitle("🙁 執行指令時出現錯誤")
        .addField("️⚠️ 錯誤內容:",
          "```js\n"+
          `${error.message}\n`+
          "```")
        .addField("🗨️ 指令內容", interaction.commandName)
        .setTimestamp()
        .setColor(danger);
      if (interaction.replied) {
        interaction.channel.send({
          embeds: [errorEmbed]
        }).catch(() => {});
      } else {
        interaction.reply({
          embeds: [errorEmbed]
        }).catch(() => {});
      }

      log.error(error.message, error);
    }
  },
};