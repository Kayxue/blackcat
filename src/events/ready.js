// Util
const ora = require("ora");
const chalk = require("chalk");
const config = require("../../config")();
const fs = require("fs");

// Slash Commands
const slash = require("../util/slash");


// CLI
let now = new Date();
let time = chalk.dim(`${now.getMonth() + 1}/${now.getDate()}`) + " | " + chalk.cyan(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}` + " | ");

const botLoader = ora(time + " " + chalk.blue("資訊") + " > " + "正在啓動黑貓客戶端").start();

module.exports = {
    event: "ready", // Name of the event
    oneTime: true, // If set to true the event will only be fired once until the client is restarted
    run: async (client) => {
        const commands=client.commands.map((e) => e.data.toJSON())
        await slash.register(client, commands);

        const username = chalk.blue(client.user.username)
        botLoader.succeed(time + " " + chalk.blue("資訊") + " > " + `${username} 啓動成功!`);
    },
};