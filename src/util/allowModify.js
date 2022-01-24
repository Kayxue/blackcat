const { GuildMember } = require("discord.js")
/**
 * 
 * @param {GuildMember} member 
 */
module.exports = (member) => member.voice?.channel?.id === member.guild?.me.voice?.channel?.id;