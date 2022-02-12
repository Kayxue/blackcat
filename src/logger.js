import chalk from "chalk";

let now = new Date();
let time = chalk.dim(`${now.getMonth() + 1}/${now.getDate()} `) + chalk.cyan(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);

function info(msg) {
  console.log(time + " " + chalk.blue("資訊") + " " + msg);
}

function warn(msg) {
  console.log(time + " " + chalk.yellowBright("警告") + " " + msg);
}

function error(msg, error) {
  console.error(time + " " + chalk.red("錯誤") + " " + msg);
  if (error) {
    let spilted = error.stack.split("\n"),
      prefixed = [];
    for (let line of spilted) {
      prefixed.push(time + " " + chalk.yellow("偵錯") + " " + line);
    }
    console.error(prefixed.join("\n"));
  }
}

export {
  info,
  warn,
  error
};
export default {
  info,
  warn,
  error
};
