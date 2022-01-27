const ora = require("ora");
const allowModify = require("../util/allowModify.js");
const {Interaction}=require("discord.js")

module.exports = {
    event: "interactionCreate", // Name of the event
    oneTime: false, // If set to true the event will only be fired once until the client is restarted
    /**
     * 
     * @param {Interaction} interaction 
     * @returns 
     */
    run: async (interaction) => {
      if (interaction.member.bot) return;
      if (!interaction.guild) return interaction.reply("❌ 你必須把我加到一個伺服器裡!");
      if (!interaction.channel) return interaction.send("❌ 無法取得頻道!");
      if (!interaction.isCommand()) return;
      const commandCheck = interaction.client.commands.get(interaction.commandName);
  
      if (!commandCheck) {
        return ora(`Could not find command" '${interaction.commandName}', is it a command?`).warn;
      } else {
        await commandCheck.run(interaction);
      }
    },
  };