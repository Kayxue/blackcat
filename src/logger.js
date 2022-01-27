const chalk = require("chalk");
const ora = require("ora");

let now = new Date();
let time = chalk.dim(`${now.getMonth() + 1}/${now.getDate()}`) + " | " + chalk.cyan(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}` + " | ");

module.exports = {
  /**
   * 成功
   * @param {String} msg 訊息
   */
   succeed: function (msg) {
    ora(time + " " + chalk.blue("資訊") + " > " + msg).succeed();
  },
  /**
   * 資訊
   * @param {String} msg 訊息
   */
  info: function (msg) {
    ora(time + " " + chalk.blue("資訊") + " > " + msg).info();
  },
  /**
   * 加載中
   * @param {String} msg 訊息
   */
   Load: function (msg) {
    ora(time + " " + chalk.blue("資訊") + " > " + msg).start();
  },
  /**
   * 警告
   * @param {String} msg 訊息
   */
  warn: function (msg) {
    ora(time + " " + chalk.yellowBright("警告") + " > " + msg).warn();
  },
  /**
   * 錯誤
   * @param {String} msg 訊息
   * @param {Boolean} stack Stack trace
   */
  error: function (msg, stack = true) {
    ora(time + " " + chalk.red("錯誤") + " > " + msg).fail();
    if (stack) console.trace();
  },
  /**
   * 注冊斜綫指令 (/)
   * @param {String} msg 訊息
   * @param {Boolean} stack Stack trace
   */
   RegSlashCmds: function (msg, stack = true) {
    ora(time + " " + chalk.red("斜綫指令") + " > " + msg).start();
    if (stack) console.trace();
  },
  /**
   * 成功加載斜綫指令 (/)
   * @param {String} msg 訊息
   * @param {Boolean} stack Stack trace
   */
   successSlashCmds: function (msg, stack = true) {
    ora(time + " " + chalk.red("斜綫指令") + " > " + msg).succeed();
    if (stack) console.trace();
  },
}