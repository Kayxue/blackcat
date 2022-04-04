import fs from "node:fs";
import log from "../logger.js";

export default async function () {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (reslove) => {
    if (fs.existsSync("./config.js")) {
      let config = await (await import("../../config.js")).default;
      let invaild = false;

      if (typeof config.token !== "string") {
        log.error("`token`不是一個字串");
        invaild = true;
      }
      if (typeof config.enableApi !== "boolean") {
        log.error("`enableApi`不是一個布林值(true/false)");
        invaild = true;
      }
      if (
        typeof config.devGuild !== "string" &&
        config.enableDev === true
      ) {
        log.error("`devGuild`不是一個字串(ID)，且`enableDev`為true");
        invaild = true;
      }
      if (typeof config.apiPort !== "number") {
        log.error("`apiPort`不是一個數字");
        invaild = true;
      }

      if (invaild) {
        log.error("設定出現錯誤，程式正在自動關閉");
        process.exit(1);
      } else {
        log.info("成功讀取設定");
        reslove(config);
      }
    } else {
      log.warn("找不到設定檔，正在從環境變數讀取");
      let config = {
        token: process.env.TOKEN,
        devGuild: process.env.DEV_GUILD,
        enableDev: !!process.env.ENABLE_DEV || false,
        enableApi: !!process.env.ENABLE_API || false,
        apiPort: process.env.API_PORT ?? process.env.PORT ?? 8080,
        optimizeQuality: !!process.env.OPTIMIZE_QUALITY || false,
      };

      let invaild = false;

      if (typeof config.token !== "string") {
        log.error("`TOKEN`不是一個字串");
        invaild = true;
      }
      if (typeof config.enableApi !== "boolean") {
        log.error("`enableApi`不是一個布林值(true/false)");
        invaild = true;
      }
      if (typeof config.devGuild !== "number" && config.enableDev) {
        log.error("`apiPort`不是一個數字");
        invaild = true;
      }
      if (typeof config.apiPort !== "number") {
        log.error("`apiPort`不是一個數字");
        invaild = true;
      }

      if (invaild) {
        log.error("設定出現錯誤，程式正在自動關閉");
        process.exit(1);
      } else {
        log.info("成功讀取設定");
        reslove(config);
      }
    }
  });
}
