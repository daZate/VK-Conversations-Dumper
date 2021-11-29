# VK Messages Dumper
Parses choosen or all conversations from VK account.

## Configuration (config.json)
- "access_token" - account access token
- "id" - array with conversations peer (leave empty if you want ALL conversations)
- "uid" - account id
- "count" - count of messages that you want to dump (set -1 if you want ALL messages)
- "display" - "files" if you want save parsed messages to .txt files, "console" if you want to display parsed messages in console, "both" - if you want both.

## Install
> **npm install vk-io** or > **yarn add vk-io**

## Run
> **node dumper.js**
