const fs = require("fs");
const path = require("path");
const syntax = require("syntax-error");
const chalk = require("chalk");

console.log(chalk.blue("Begin checking JavaScript syntax"));

function check (source, file) {
  let error = syntax(source);
  console.log(("=").repeat(60));
  if (error) {
    console.error(chalk.red.bold(`${file} have syntax error`));
    console.error(chalk.red.bold(error.annotated));
    process.exit(1);
  } else {
    console.log(chalk.green(`${file} check passed`));
  }
  console.log(("=").repeat(60));
}

check(fs.readFileSync("./index.js"), "index.js");
check(fs.readFileSync("./include/player.js"), "include/player.js");
check(fs.readFileSync("./util/Util.js"), "util/Util.js");

const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  check(fs.readFileSync(path.join(__dirname, "commands", file)), file);
}
