const chalk = require("chalk");

let now = new Date();
let time = chalk.dim(`${now.getMonth}/${now.getDate} `) + chalk.cyan()

module.exports = {
  /**
   * 資訊
   * @param {String} msg 訊息
   */
  info: function(msg) {
    
  },
}