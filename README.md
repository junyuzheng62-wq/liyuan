# 里院旧时光 · 3D 网页 Demo

React 19 + React Three Fiber + Three.js + Vite。程序化低模场景，无需下载模型、图片或字体。

## 在 Mac 本地启动

需要 Node.js 22.12+，推荐 Node.js 24 LTS。下载源码 ZIP，双击解压，将解压后的 `liyuan-demo` 文件夹放在“下载”目录。

在 Mac 的“终端”运行：

```bash
cd ~/Downloads/liyuan-demo
npm ci
npm run dev -- --port 5173
```

保持终端开启，然后在 Safari 打开 http://localhost:5173/ 。这里的 localhost 指你的 Mac；云端启动的服务器不能通过 Mac 的 localhost 访问。

若文件夹位于其他位置，可以在终端输入 `cd `（后面有空格），将文件夹拖入终端，再按回车。随后运行上面两条 npm 命令。

如果提示找不到 npm，先从 https://nodejs.org/ 安装 Node.js LTS，再重新打开终端。服务器默认监听 `0.0.0.0`。手机与 Mac 连同一 Wi-Fi 后，可使用 `http://Mac局域网IP:5173/` 打开；注意 macOS 防火墙的入站连接提示。

## 云端启动

```bash
cd /workspace/liyuan
npm ci --cache /workspace/.npm-cache
npm run dev -- --port 5173
```

该地址仅在云机器内部可达。外部浏览器需要平台提供的端口转发或公开 HTTPS 预览入口，不能直接访问云机器 localhost 或私网 IP。

生产构建：`npm run build`；构建预览：`npm run preview -- --port 4173`。

## 操作

- 点击“走进旧时光”。推荐手机横屏，竖屏也有适配。
- 左下摇杆移动，右侧空白处拖动调整镜头，支持多指同时移动和转向。
- 桌面支持 WASD / 方向键移动、鼠标拖动转向、E 键互动。
- 靠近金色标记（旧收音机、喜宴长桌、回家的门）后，点击“听听故事”。
- 对话期间停止移动；点击“再走走”继续。三处互动各计一次记忆。

## 当前范围

包含院落、二层外廊、窗户、楼梯装饰、晾衣与植物、临时男孩、自动跟随海鸥、第三人称镜头、边界与主要物件碰撞、三个物品对话。地砖采用实例化渲染。

角色和场景均为程序化临时资产，并非用户角色原图的一比一模型，也非考据完成的特定院址复原。楼梯仅作场景装饰，不可攀登；没有完整剧情、音频、存档或跨会话进度。阴影和后续美术仍需真机性能优化。

开发模式提供只读状态快照 `window.__LIYUAN_STATE__`，用于浏览器验证移动、跟随和镜头；生产构建不设置该快照。
