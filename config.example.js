export default {
  token: process.env.TOKEN || "BOT_TOKEN",
  // 範例: MTdqrd0vGDV1dcF0QPjom6OB.NQxUhj.I4JjFHIympR3mVF3UiUbbD5VVbi
  // 如果要從環境變數使用，請輸入:
  // process.env.<變數名稱>
  optimizeQuality: false,
  // 是否啟用優化品質，優化品質會減少一些資源消耗，但是會停用音量控制及nightcore音效
  cookie: undefined,
  // 播放器使用的YouTube cookie
};
