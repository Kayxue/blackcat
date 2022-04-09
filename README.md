<h3 align="center">Black cat</h3>
<p align="center">
  <img src="https://catmusic.ml/favicon.png" width="70" height="70" />
</p>

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=F7DF1E) ![Discord](https://img.shields.io/badge/Discord-%237289DA.svg?style=for-the-badge&logo=discord&logoColor=white&color=5865F2)

![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/blackcatbot/blackcat?color=F44A6A&label=CodeFactor&logo=codefactor&logoColor=FFFFFF&style=flat-square) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/blackcatbot/blackcat/Build%20and%20Push?color=2088FF&label=Docker&logo=GitHub%20actions&logoColor=FFFFFF&style=flat-square) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/blackcatbot/blackcat/Code%20Scanning?color=2088FF&label=CodeQL&logo=GitHub%20actions&logoColor=FFFFFF&style=flat-square) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/blackcatbot/blackcat/Lint%20&%20Format%20code?color=2088FF&label=Linter&logo=GitHub%20actions&logoColor=FFFFFF&style=flat-square)

## 功能

- 播放 Youtube 上的音樂
- 音量控制
- 可使用按鈕控制音樂
- 擁有 Nightcore 音效
- 全面使用斜線指令

## 技術

- 使用 Node.js Addon API (NAPI)嵌入 C, C++程式碼來處理音訊
- 只有播放直播影片時才會啟用 FFmpeg 解碼器

## 安裝

> 注意：黑貓程式碼是專門為 Linux 所打造，如果您正在使用 Windows，請嘗試使用[`WSL`](https://ubuntu.com/wsl)或是使用 Docker

- 使用 Node.js (你必須安裝 Node.js)

  1. 複製程式碼

  ```sh
  git clone https://github.com/blackcatbot/blackcat
  ```

  或是使用[`gh`](https://cli.github.com)

  ```sh
  gh repo clone blackcatbot/blackcat
  ```

  2. 安裝所需套件

  ```sh
  yarn install
  ```

  3. 填寫`config.example.js`並重新命名成`config.js`
  4. 啟動機器人

  - 程式關閉時自動重新啟動

  ```sh
  bash start.sh
  ```

  - 只啟動機器人

  ```sh
  node src/index.js
  ```

- 使用 Docker 映像檔

  1. 拉取 Docker 映像檔

  ```sh
  docker pull wolfyuan/blackcat
  ```

  2. 啟動機器人

  ```sh
  docker run -d -e TOKEN="機器人Token" \
    -e devGuild="測試伺服器ID" \
    -e enableDev="是否啟用開發者模式(true/false)" \
    -e enableApi="是否啟用API(true/false)" \
    -e apiPort="API埠號" \
    --name blackcat wolfyuan/blackcat
  ```

## 貢獻者

|      名稱      |          內容          |
| :------------: | :--------------------: |
| wolf-yuan-6115 | 創辦人/開發者/網頁設計 |
| ItzMiracleOwO  |   聯合創辦人/貢獻者    |
|     KayXue     |         開發者         |

![Repobeats](https://repobeats.axiom.co/api/embed/a6bd28c74d122a98b8db7d45fd5ca39ad0e8b12e.svg)

> Black cat source code Licensed under Apache 2.0
