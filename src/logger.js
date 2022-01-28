const chalk = require("chalk");

let now = new Date();
let time = chalk.dim(`${now.getMonth() + 1}/${now.getDate()} `) + chalk.cyan(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);

module.exports = {
  /**
   * 資訊
   * @param {String} msg 訊息
   */
  info: function(msg) {
    console.log(time+" "+chalk.blue("資訊")+" "+msg);
  },
  /**
   * 警告
   * @param {String} msg 訊息
   */
  warn: function(msg) {
    console.log(time+" "+chalk.yellowBright("警告")+" "+msg);
  },
  /**
   * 錯誤
   * @param {String} msg 訊息
   * @param {Boolean} stack Stack trace
   */
  error: function(msg, stack=true) {
    console.error(time+" "+chalk.red("錯誤")+" "+msg);
    if (stack) console.trace();
  }
};