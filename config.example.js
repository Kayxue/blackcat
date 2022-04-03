export default {
  token: "BOT_TOKEN" || process.env.TOKEN,
  // 範例: MTdqrd0vGDV1dcF0QPjom6OB.NQxUhj.I4JjFHIympR3mVF3UiUbbD5VVbi
  // 如果要從環境變數使用，請輸入:
  // process.env.<變數名稱>
  devGuild: "00000000000000000",
  // 斜線指令伺服器ID，可用於開發測試
  // 由於全域斜線指令需要一小時才會更新，但是測試模式可以只單獨更新一個伺服器的指令
  // 這樣做會讓測試模式更新時間更短
  optimizeQuality: false,
  // 是否啟用優化品質，優化品質會減少一些資源消耗，但是會停用音量控制及nightcore音效
  enableDev: false,
  // 是否啟用開發測試模式
  // 如果此設定為true，則devGuild必須設定伺服器ID
  enableApi: true,
  // 注意：此功能尚未支援
  // 是否要啟用API伺服器
  apiPort: process.env.PORT || 8080,
  // API伺服器監聽端口
};
