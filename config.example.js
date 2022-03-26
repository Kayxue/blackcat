import log from "./src/logger.js";

/**
 * @typedef {Object} config 設定檔
 * @property {String} token Discord機器人Token
 * @property {Boolean} enableApi 是否啟用API伺服器
 * @property {Boolean} enableWeb 是否啟用網頁伺服器
 * @property {Number} apiPort API伺服器監聽端口
 */

/**
 * 黑貓設定文件
 * @return {config} 設定檔
 */
export default function () {
  const config = {
    token: process.env.TOKEN || "TOKEN",
    // 範例: MTdqrd0vGDV1dcF0QPjom6OB.NQxUhj.I4JjFHIympR3mVF3UiUbbD5VVbi
    // 如果要從環境變數使用，請輸入:
    // process.env.<變數名稱>
    prefix: process.env.PREFIX || "PREFIX",
    // 指令前綴
    slashGuild: process.env.SLASH_GUILD || "000000000000000000",
    // 斜線指令伺服器ID，可用於開發測試
    enableDev: false,
    // 是否啟用開發測試模式
    enableApi: false,
    // 注意：此功能尚未支援
    // 是否要啟用API伺服器
    apiPort: process.env.PORT || 8080,
    // API伺服器監聽端口
  };

  // 請勿修改
  // Do not modify
  let invaild = false;
  if (typeof config.token !== "string") {
    log.error("`token`不是一個字串");
    invaild = true;
  }
  if (typeof config.enableApi !== "boolean") {
    log.error("`enableApi`不是一個布林值(true/false)");
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
    return config;
  }
}