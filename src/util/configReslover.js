import fs from "node:fs";
import log from "../logger.js";

export default async function () {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (reslove) => {
    let fileConfig = {};
    let invaild = false;

    if (fs.existsSync("./config.js")) {
      fileConfig = await (await import("../../config.js")).default;
    }

    let config = {
      token: fileConfig.token ?? process.env.TOKEN,
      debug: fileConfig.debug ?? process.env.DEBUG,
      cookie: fileConfig.cookie ?? process.env.COOKIE,
    };

    if (!config.token) {
      log.error("`token`無效", undefined, "設定");
      invaild = true;
    }
    if (
      config.debug.toString().toLowerCase() !== "true" &&
      config.debug.toString().toLowerCase() !== "false"
    ) {
      log.error("`debug`不是一個布林值", undefined, "設定");
      invalid = true;
    } else {
      config.debug = config.debug.toString().toLowerCase() === "true";
    }

    if (invaild) {
      log.error("設定出現錯誤，程式正在關閉", undefined, "設定");
      process.exit(1);
    } else {
      log.info("成功讀取設定", "設定");
      reslove(config);
    }
  });
}
