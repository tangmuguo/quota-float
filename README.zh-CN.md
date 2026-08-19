# Quota Float · Ubuntu 26.04

[English](README.md) | [简体中文](README.zh-CN.md)

一款面向 Ubuntu 26.04 的 Codex 额度悬浮组件。它读取本机现有的 Codex 登录状态，并将剩余额度显示在 ChatGPT 桌面版窗口的右下角。

![Quota Float 配额状态](docs/images/quota-states.png)

## 为 Ubuntu 26.04 优化

- 仅面向 x86_64 的 Ubuntu 26.04 LTS，发布原生 Debian 安装包（`.deb`）。
- 使用 Ubuntu 的 GTK 运行时栈：WebKitGTK 4.1、GTK 3 t64、Ayatana AppIndicator；不发布 AppImage。
- 通过随 `.deb` 安装的 GNOME Shell 扩展，在合成器层把组件固定在当前 ChatGPT 桌面版窗口右下角 24 px 边距处；原生 GNOME Wayland 不再依赖会被 Mutter 拒绝的客户端坐标请求。
- 跟随 ChatGPT 窗口的移动、缩放、工作区切换、最小化和恢复；组件不是跨工作区、始终覆盖桌面的独立悬浮窗。
- 面板缩放只执行原生尺寸切换，扩展在下一次合成器刷新中移动已缩放后的窗口，避免 Wayland 下“缩放 + 定位”导致的卡死。
- 托盘菜单提供显示/隐藏、刷新额度、解除鼠标穿透、语言切换、开机启动和退出操作。

## 显示内容

- Codex 套餐、本周剩余额度、下次重置时间，以及接口提供时的重置机会信息。
- 正常、提醒、紧急、过期、未登录和暂不可用等状态。
- 320 × 320 完整面板和 100 × 100 紧凑额度圆球。
- 持久保存面板尺寸、显示状态、鼠标穿透、语言和自动轮换等偏好。

## 安装

从 Release 页面下载 Ubuntu 26.04 的 `.deb`，使用 `apt` 安装以自动处理运行时依赖：

```bash
sudo apt install ./quota-float_*_amd64.deb
```

请先在同一台电脑上登录 Codex。首次安装或更新 `.deb` 后，请注销并重新登录一次，让 GNOME Shell 扫描系统扩展，再启动 Quota Float；应用随后会为当前用户自动启用它。若曾手动禁用，可执行：

```bash
gnome-extensions enable quota-float-anchor@quotafloat.app
```

安装包会声明所需的 Ubuntu 26.04 运行时依赖，包括 `libwebkit2gtk-4.1-0`、`libgtk-3-0t64`、`libayatana-appindicator3-1` 和 GNOME Shell 48 以上版本。

## GNOME Wayland 的窗口位置

Wayland 正确地禁止普通应用嵌入另一个应用窗口，或强制任意屏幕坐标。Quota Float 因此仅把“定位”交给本地 GNOME Shell 扩展：扩展识别 Quota Float 与 ChatGPT 桌面版窗口，把现有的 Quota Float 窗口移动到 ChatGPT 窗口右下角。它不读取窗口内容，也不访问网络。

组件在 ChatGPT 处于活动状态（或正在与组件交互）时显示；尺寸变化会自动重新锚定，ChatGPT 不在前台时不会留在桌面中央。随包扩展支持 GNOME Shell 48–50。

## 工作原理

Quota Float 只读取已有的本机登录文件：

- 已设置 `CODEX_HOME` 时：`$CODEX_HOME/auth.json`；
- 否则：`~/.codex/auth.json`。

它仅使用已有会话调用 Codex/ChatGPT 额度接口；不会按本地 Token 数估算额度、兑换重置机会、修改账户设置，也不会保存凭据。

浏览器预览模式使用模拟数据。读取真实额度需要运行 Tauri 桌面应用，并且本机已经登录 Codex。

## 开发环境

先安装 Ubuntu 26.04 的系统依赖：

```bash
sudo apt update
sudo apt install \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

再准备 Node.js 20+、Rust stable，并执行：

```bash
npm ci
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri dev
```

## 构建

生成 Ubuntu 安装包：

```bash
npm run tauri:ubuntu
```

产物位置：

```text
src-tauri/target/release/bundle/deb/
```

本仓库刻意只生成 `.deb`。当前 AppImage 打包方式可能与 Ubuntu 26.04 的 Wayland、Mesa、GLib 和 WebKitGTK 运行时产生冲突。

## 隐私与准确性

- 仅在应用配置目录保存悬浮组件偏好。
- 不保存或记录 Token、账户 ID、提示词、聊天记录、原始接口响应和认证文件路径。
- 额度服务并非公开稳定 API；登录态或响应格式改变时，组件会显示安全的不可用/过期状态，不会编造数值。

完整说明见 [PRIVACY.md](PRIVACY.md) 与 [SECURITY.md](SECURITY.md)。

## 发布

GitHub Actions 使用 `ubuntu-26.04` runner 验证和打包。推送 `v*` 标签后，会生成包含一个 `.deb` 与 `SHA256SUMS.txt` 的草稿 Release。

发布前请阅读 [docs/RELEASE.md](docs/RELEASE.md)。

## 许可证

MIT
