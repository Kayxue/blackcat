import Player from "./Player.js";

function getSendingPlayer(client, id) {
  return client.players.get(id);
}
function createSendingPlayer(interaction) {
  const player = new Player(interaction, interaction.guild, interaction.member.voice.channel);
  interaction.client.players.set(interaction.guildId, player);
  return player;
}

export const getSendingPlayer = getSendingPlayer
export const createSendingPlayer = createSendingPlayer
export default {
  getSendingPlayer,
  createSendingPlayer
};
