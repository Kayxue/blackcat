const ora = require("ora");
const chalk = require("chalk");
const empty = require("is-empty");
const config = require("../../config")();
const { Client, Collection } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

let now = new Date();
let time =
    chalk.dim(`${now.getMonth() + 1}/${now.getDate()}`) +
    " | " +
    chalk.cyan(
        `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}` + " | ",
    );

const slash = {
    /**
     *
     * @param {Client} client
     * @param {Collection} commands
     */
    register: async (client, commands) => {
        const loadSlash = ora(
            time + " " + chalk.red("斜綫指令") + " > " + `開始注冊斜綫指令 (/)`,
        ).start();
        const command = await client.application?.commands.set(
            commands,
        );
        loadSlash.succeed(
            time + " " + chalk.red("斜綫指令") + " > " + `成功加載斜綫指令 (/)`,
        );
    },
};

module.exports = slash;
