import chalk from "chalk";
import getDateString from "./util/getDateString.js";

function info(msg) {
  console.log(getDateString() + " " + chalk.blue("資訊") + " " + msg);
}

function warn(msg) {
  console.log(
    getDateString() + " " + chalk.yellowBright("警告") + " " + msg,
  );
}

function error(msg, error) {
  console.error(
    getDateString() + " " + chalk.red("錯誤") + " " + msg,
  );
  if (error) {
    let spilted = error.stack.split("\n"),
      prefixed = [];
    for (let line of spilted) {
      prefixed.push(
        getDateString() + " " + chalk.yellow("偵錯") + " " + line,
      );
    }
    console.error(prefixed.join("\n"));
  }
}

export { info, warn, error };
export default {
  info,
  warn,
  error,
};
