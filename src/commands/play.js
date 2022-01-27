const PlayerManager = require("../audio/PlayerManager.js");
const { CommandInteraction } = require("discord.js");
const allowModify = require("../util/allowModify.js")
const {SlashCommandBuilder}=require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("播放音樂")
        .addStringOption((option) =>
            option
                .setName("input")
                .setDescription("鏈接或歌曲名稱")
                .setRequired(true),
        ),

    /**
     *
     * @param {CommandInteraction} interaction
     * @returns
     */
    run: async function (interaction) {
        if (!interaction.member.voice?.channel)
            return interaction.reply("❌ 你必須加入一個語音頻道");
        const permissionBot = interaction.member.voice?.channel.permissionsFor(
            interaction.guild.me,
        );
        if (!permissionBot.has("CONNECT") || !permissionBot.has("SPEAK"))
            return interaction.reply("❌ 我無法連線至語音頻道！");
        const url = interaction.options.getString("input");
        let player;
        if (!PlayerManager.getSendingPlayer(interaction.guild.id)) {
            player = PlayerManager.createSendingPlayer(interaction);
            player.init();
        } else {
            player = PlayerManager.getSendingPlayer(interaction.guild.id);
            if (!allowModify(interaction))
                return interaction.reply("❌ 你必須加入一個語音頻道");
        }
        await interaction.deferReply();
        player.play(url, interaction);
    },
};
