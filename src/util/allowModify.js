export default (interaction) => {
  return (
    interaction.member.voice?.channel?.id ===
    interaction.member.guild?.members.me.voice?.channel?.id
  );
};
