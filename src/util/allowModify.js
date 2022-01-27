const {
    GuildMember
} = require("discord.js")
/**
 * 
 * @param {GuildMember} member 
 */

module.exports = (interaction) => interaction.member.voice?.channel?.id === interaction.member.guild?.me.voice?.channel?.id;