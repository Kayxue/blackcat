const { SlashCommandBuilder } = require("@discordjs/builders");

const slashInfo = new SlashCommandBuilder()
    .setName("play")
    .setDescription("播放音樂")
    .addStringOption((option) =>
        option
            .setName("input")
            .setDescription("鏈接或歌曲名稱")
            .setRequired(true),
    );
console.log(slashInfo.toJSON())
