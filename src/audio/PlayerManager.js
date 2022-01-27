const {Collection,CommandInteraction} = require("discord.js");
const Player=require("./Player")

class PlayerManager {
  static playerCollections=new Collection();

  static getSendingPlayer(id) {
    return PlayerManager.playerCollections.get(id);
  }

  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  static createSendingPlayer(interaction){
    const player=new Player(interaction,interaction.guild,interaction.member.voice.channel);
    PlayerManager.playerCollections.set(interaction.guildId,player)
    return player
  }
}

module.exports = PlayerManager;