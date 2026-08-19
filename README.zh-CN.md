# Quota Float · Ubuntu 26.04

[English](README.md) | [简体中文](README.zh-CN.md)

一款面向 Ubuntu 26.04 的 Codex 额度桌面悬浮组件。它读取本机现有的 Codex 登录状态，在桌面右下角附近显示剩余额度。

![Quota Float 配额状态](docs/images/quota-states.png)

## 为 Ubuntu 26.04 优化

- 仅面向 x86_64 的 Ubuntu 26.04 LTS，发布原生 Debian 安装包（`.deb`）。
- 使用 Ubuntu 的 GTK 运行时栈：WebKitGTK 4.1、GTK 3 t64、Ayatana AppIndicator；不发布 AppImage。
- 启动和切换面板尺寸时，请求定位到可用工作区右下角 24 px 边距处；在 Ubuntu Xorg/XWayland 下可精确定位。
- GNOME Wayland 下保留原生 Wayland WebKit 路径，不为定位而强制 XWayland。GNOME 本身决定顶层窗口位置，因此组件提供拖动定位和位置记忆。
- 默认置顶并显示在所有工作区，同时保留任务栏入口；即使当前 GNOME 会话未显示 AppIndicator，也可以恢复窗口。
- 托盘菜单提供右下角定位、刷新额度、解除鼠标穿透、语言切换、开机启动和退出操作。

## 显示内容

- Codex 套餐、本周剩余额度、下次重置时间，以及接口提供时的重置机会信息。
- 正常、提醒、紧急、过期、未登录和暂不可用等状态。
- 320 × 320 完整面板和 100 × 100 紧凑额度圆球。
- 持久保存面板尺寸、显示状态、鼠标穿透、置顶、语言和手动位置等偏好。

## 安装

从 Release 页面下载 Ubuntu 26.04 的 `.deb`，使用 `apt` 安装以自动处理运行时依赖：

```bash
sudo apt install ./quota-float_*_amd64.deb
```

请先在同一台电脑上登录 Codex，再启动 Quota Float。若组件被最小化，或当前桌面没有显示托盘图标，可从 Dock 或“活动概览”再次启动 **Quota Float Ubuntu** 来恢复它。

安装包会声明所需的 Ubuntu 26.04 运行时依赖，包括 `libwebkit2gtk-4.1-0`、`libgtk-3-0t64`、`libayatana-appindicator3-1` 和 `xwayland`。

## GNOME Wayland 的窗口位置

Wayland 合成器不允许普通应用强制指定屏幕坐标。Quota Float 会请求右下角位置；若 GNOME 决定以其他初始位置显示，组件仍可正常使用。

可拖动完整面板的标题区域，或直接拖动紧凑圆球，将它放到所需位置。桌面会话支持时，应用会记住该位置。使用托盘菜单的 **Move to bottom right / 移动至右下角** 可以清除记忆的位置，并再次请求默认右下角布局。

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
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  xwayland
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
