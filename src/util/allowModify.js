export default (interaction) => {
  return interaction.member.voice?.channel?.id === interaction.member.guild?.me.voice?.channel?.id;
};
