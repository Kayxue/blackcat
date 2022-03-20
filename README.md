<h3 align="center">Black cat</h3>
<p align="center">
  <img src="https://catmusic.ml/favicon.png" />
</p>

![NodeJS](https://img.shields.io/badge/Node.js-6DA55F?style=flat-square&logo=node.js&logoColor=white)
[![codebeat badge](https://codebeat.co/badges/92ee76a9-f812-4a55-beb5-c02375a441c6)](https://codebeat.co/projects/github-com-blackcatbot-blackcat-rewrite)

## 功能
- 播放Youtube上的音樂
- 音量控制
- 可使用按鈕控制音樂
- 擁有Nightcore音效
- 全面使用斜線指令

## 技術
- 使用Node.js Addon API (NAPI)嵌入C, C++程式碼來處理音訊
- 只有播放直播影片時才會啟用FFmpeg解碼器

## 安裝

> 注意：黑貓程式碼是專門為Linux所打造，如果您正在使用Windows，請嘗試使用[`WSL`](https://ubuntu.com/wsl)或是使用Docker

- 使用Node.js

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
    bash setup.sh
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
- 使用Docker映像檔
  
  Under development

## 貢獻者

| 名稱 | 內容 |
| :---: | :---: |
| wolf-yuan-6115 | 創辦人/開發者/網頁設計 |
| ItzMiracleOwO | 聯合創辦人/貢獻者 |
| KayXue | 開發者 |


> Black cat source code
> Licensed under Apache 2.0
