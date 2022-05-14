import PlayerManager from "../audio/PlayerManager.js";
import Canvas from "skia-canvas";
import { MessageEmbed, MessageAttachment } from "discord.js";
import { blurple } from "../color.js";

export default {
  data: {
    name: "nowplaying",
    description: "查看目前正在播放的音樂",
  },
  run: async function (interaction) {
    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      return interaction
        .reply("❌ ┃ 必須要有音樂正在播放")
        .catch(() => {});
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
    }

    let data = player.nowplaying;

    Canvas.FontLibrary.use("noto", "src/assets/notosansTC.otf");
    Canvas.FontLibrary.use("joypixels", "src/assets/joypixels.ttf");
    let canvas = new Canvas.Canvas(960, 300);
    let ctx = canvas.getContext("2d");
    let bg;
    try {
      bg = await Canvas.loadImage(
        `https://i3.ytimg.com/vi/${data.id}/maxresdefault.jpg`,
      );
    } catch (e) {
      bg = await Canvas.loadImage(
        "https://raw.githubusercontent.com/blackcatbot/blackcat-app/main/public/unknown.png",
      );
    }
    let percentage =
      Math.round((player.playTime / data.duraction) * 100) / 100;
    Canvas.FontLibrary.use("noto", "src/assets/notosansTC.otf");
    Canvas.FontLibrary.use("joypixels", "src/assets/joypixels.ttf");
    ctx.fillStyle = "#15202b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let percent = bg.width / 200;
    let bgHeight = bg.height / percent;
    let bgWidth = bg.width / percent;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(30 + 5, 25);
    ctx.lineTo(30 + bgWidth - 5, 25);
    ctx.quadraticCurveTo(30 + bgWidth, 25, 30 + bgWidth, 25 + 5);
    ctx.lineTo(30 + bgWidth, 25 + bgHeight - 5);
    ctx.quadraticCurveTo(
      30 + bgWidth,
      25 + bgHeight,
      30 + bgWidth - 5,
      25 + bgHeight,
    );
    ctx.lineTo(30 + 5, 25 + bgHeight);
    ctx.quadraticCurveTo(30, 25 + bgHeight, 30, 25 + bgHeight - 5);
    ctx.lineTo(30, 25 + 5);
    ctx.quadraticCurveTo(30, 25, 30 + 5, 25);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(bg, 30, 25, bgWidth, bgHeight);
    ctx.restore();
    ctx.font = "25px noto";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("正在播放:", 250, 50);
    ctx.font = `50px noto, joypixels`;
    let text = data.title;
    let textLength = 25;
    while (
      ctx.measureText(`${text.substring(0, textLength)}...`).width >
      canvas.width - 250
    ) {
      textLength -= 1;
    }
    if (text.length > textLength) {
      text = text.substring(0, textLength) + "...";
    }
    ctx.fillText(text, 250, 110);
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(20 + 5, 200);
    ctx.lineTo(50 + 860 - 5, 200);
    ctx.quadraticCurveTo(50 + 860, 200, 50 + 860, 200 + 5);
    ctx.lineTo(50 + 860, 200 + 10 - 5);
    ctx.quadraticCurveTo(50 + 860, 200 + 10, 50 + 860 - 5, 200 + 10);
    ctx.lineTo(50 + 5, 200 + 10);
    ctx.quadraticCurveTo(50, 200 + 10, 50, 200 + 10 - 5);
    ctx.lineTo(50, 200 + 5);
    ctx.quadraticCurveTo(50, 200, 50 + 5, 200);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.moveTo(50 + 5, 200);
    ctx.lineTo(50 + percentage * 860 - 10, 200);
    ctx.quadraticCurveTo(
      50 + percentage * 860,
      200,
      50 + percentage * 860,
      200 + 5,
    );
    ctx.lineTo(50 + percentage * 860, 200 + 10 - 5);
    ctx.quadraticCurveTo(
      50 + percentage * 860,
      200 + 10,
      50 + percentage * 860 - 5,
      200 + 10,
    );
    ctx.lineTo(50 + 5, 200 + 10);
    ctx.quadraticCurveTo(50, 200 + 10, 50, 200 + 10 - 5);
    ctx.lineTo(50, 200 + 5);
    ctx.quadraticCurveTo(50, 200, 50 + 5, 200);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px noto,joypixels";
    let enabledMode = [];

    if (!interaction.client.config.optimizeQuality) {
      if (player.muted) enabledMode.push("🔇 靜音");
      else enabledMode.push(`🔊 音量: ${player.volume * 100}%`);
    }
    if (player.enabledMode.loop) enabledMode.push("🔁 循環播放");
    if (player.enabledMode.repeat) enabledMode.push("🔂 重複播放");
    enabledMode.push(`👥 點歌者: ${player.queuer}`);
    let playtime = new Date(player.playTime * 1000).toISOString();
    if (data.duraction <= 0) playtime = "直播";
    else if (data.duraction < 3600) playtime = playtime.substr(14, 5);
    else playtime = playtime.substr(11, 8);
    ctx.fillText(
      `${playtime}/${data.duractionParsed} | ${enabledMode.join(
        " | ",
      )}`,
      50,
      250,
    );
    let buffer = await canvas.toBuffer("png");

    let attachment = new MessageAttachment(
      buffer,
      `${interaction.guildId}.png`,
    );

    let nowEmbed = new MessageEmbed()
      .setTitle("🎧 ┃ 正在播放")
      .setDescription(`[${data.title}](${data.url})`)
      .setThumbnail(data.thumbnail)
      .setImage(`attachment://${interaction.guildId}.png`)
      .setColor(blurple);
    return interaction
      .reply({
        embeds: [nowEmbed],
        files: [attachment],
      })
      .catch(() => {});
  },
};
