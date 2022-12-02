import chalk from "chalk";
import getDateString from "./util/getDateString.js";

function info(msg, sender) {
  console.log(
    getDateString() +
      " " +
      chalk.green(sender ?? "未知") +
      " " +
      chalk.blue("資訊") +
      " " +
      msg,
  );
}

function warn(msg, sender) {
  console.log(
    getDateString() +
      " " +
      chalk.green(sender ?? "未知") +
      " " +
      chalk.yellowBright("警告") +
      " " +
      msg,
  );
}

function error(msg, error, sender) {
  console.error(
    getDateString() +
      " " +
      chalk.green(sender ?? "未知") +
      " " +
      chalk.red("錯誤") +
      " " +
      msg,
  );
  if (error) {
    const spilted = error.stack.split("\n");
    const prefixed = [];
    for (const line of spilted) {
      prefixed.push(
        getDateString() + " " + chalk.yellow("偵錯") + " " + line,
      );
    }
    console.error(prefixed.join("\n"));
  }
}

function debug(msg) {
  console.log(chalk.dim(msg));
}

export { info, warn, error, debug };
export default {
  info,
  warn,
  error,
  debug,
};
