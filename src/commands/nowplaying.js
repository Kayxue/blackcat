import PlayerManager from "../audio/PlayerManager.js";
import Canvas from "@napi-rs/canvas";
import imageSize from "image-size";
import { request } from "undici";
import { EmbedBuilder, Attachment } from "discord.js";
import { blurple } from "../color.js";
import { join, resolve } from "node:path";

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

    const data = player.nowplaying;

    Canvas.GlobalFonts.registerFromPath(
      join(resolve(), "src", "assets", "notosansTC.otf"),
      "noto",
    );
    Canvas.GlobalFonts.registerFromPath(
      join(resolve(), "src", "assets", "joypixels.ttf"),
      "joypixels",
    );
    const canvas = new Canvas.Canvas(960, 300);
    const ctx = canvas.getContext("2d");
    let bg;
    try {
      const { body } = await request(
        `https://i3.ytimg.com/vi/${data.id}/maxresdefault.jpg`,
      );
      bg = new Canvas.Image();
      bg.src = Buffer.from(await body.arrayBuffer());
    } catch (e) {
      const { body } = await request(
        "https://raw.githubusercontent.com/blackcatbot/blackcat-app/main/public/unknown.png",
      );
      bg = new Canvas.Image();
      bg.src = Buffer.from(await body.arrayBuffer());
    }
    const percentage =
      Math.round((player.playTime / data.duraction) * 100) / 100;
    ctx.fillStyle = "#15202b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bgData = await imageSize(bg.src);
    const percent = bg.width / 200;
    const bgHeight = bgData.height / percent;
    const bgWidth = bgData.width / percent;
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
    ctx.font = "50px noto, joypixels";
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
    const enabledMode = [];

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
    const buffer = canvas.toBuffer("image/png");

    const attachment = new Attachment(
      buffer,
      `${interaction.guildId}.png`,
    );

    const nowEmbed = new EmbedBuilder()
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
