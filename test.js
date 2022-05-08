import Canvas from "skia-canvas";

let canvas = new Canvas.Canvas(960, 300);
let ctx = canvas.getContext("2d");
let bg = await Canvas.loadImage(
  "https://i3.ytimg.com/vi/6OnWUXpuOpQ/maxresdefault.jpg",
);

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
let text = `📎チキチキバンバン (TV Ver.)`;
if (text.length > 25) {
  text = text.substring(0, 25) + "...";
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
ctx.lineTo(50 + (Math.round((50 / 100) * 100) / 100) * 860 - 10, 200);
ctx.quadraticCurveTo(
  50 + (Math.round((50 / 100) * 100) / 100) * 860,
  200,
  50 + (Math.round((50 / 100) * 100) / 100) * 860,
  200 + 5,
);
ctx.lineTo(
  50 + (Math.round((50 / 100) * 100) / 100) * 860,
  200 + 10 - 5,
);
ctx.quadraticCurveTo(
  50 + (Math.round((50 / 100) * 100) / 100) * 860,
  200 + 10,
  50 + (Math.round((50 / 100) * 100) / 100) * 860 - 5,
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
ctx.fillText("1:50/3:00 | 🔁重複播放", 50, 250);

canvas.saveAs("test.png");
