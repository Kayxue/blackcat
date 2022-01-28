const Player = require("./Player.js");

class PlayerManager {
  static getSendingPlayer(client, id) {
    return client.players.get(id);
  }

  static createSendingPlayer(interaction) {
    const player = new Player(interaction, interaction.guild, interaction.member.voice.channel);
    interaction.client.players.set(interaction.guildId, player);
    return player;
  }

  static deleteSendingPlayer(client, id) {
    client.players.delete(id);
  }
}

module.exports = PlayerManager;