# Quota Float · Ubuntu 26.04 项目简介

## 一句话定位

Quota Float 是一个面向 Ubuntu 26.04 的 Tauri 2 悬浮组件。它通过本机已有的 Codex 登录态只读查询额度，并以置顶卡片或紧凑圆球显示每周额度、重置时间、重置机会和会员类型。

## 技术栈

- 前端：React 19、TypeScript、Vite、Phosphor Icons。
- 桌面壳：Tauri 2、Rust、GTK/WebKitGTK。
- 网络：Rust `reqwest` 只读调用 ChatGPT 额度接口。
- 打包：Ubuntu 26.04 原生 Debian (`.deb`) 包。
- 测试：Vitest 覆盖前端格式化、快照合并和面板状态；Rust 覆盖额度解析与窗口几何。

## Ubuntu 桌面行为

- 无边框、透明、置顶、默认显示在所有工作区。
- 请求将 320 × 320 面板或 100 × 100 圆球放在当前工作区右下角；Xorg/XWayland 下精确执行。
- GNOME Wayland 下遵守合成器的窗口放置策略，标题区域和圆球可拖动定位；会话能够报告坐标时持久保存位置。
- 关闭或隐藏时最小化到任务栏，而不是只依赖托盘；这适配未显示 AppIndicator 的 GNOME 会话。
- 托盘菜单支持显示/最小化、刷新、右下角定位、解除鼠标穿透、语言切换、开机启动和退出。
- `tauri-plugin-autostart` 在 Linux 使用 XDG autostart 入口。

## 关键文件

- `src/App.tsx`：刷新、退避、stale 状态、偏好保存与拖动桥接。
- `src/components/QuotaCard.tsx`：完整面板、紧凑圆球和 Ubuntu 拖动区域。
- `src/lib/bridge.ts`：浏览器 mock 与 Tauri command 桥接。
- `src-tauri/src/codex.rs`：读取本地认证、调用并解析额度接口。
- `src-tauri/src/ubuntu_host.rs`：工作区右下角布局、多显示器/缩放钳制和 Wayland 容错。
- `src-tauri/src/lib.rs`：偏好持久化、窗口命令、托盘、自启动、单实例与任务栏恢复。
- `src-tauri/tauri.conf.json`：Ubuntu 26.04 `.deb` 目标及其运行时依赖。
- `.github/workflows/*.yml`：在 `ubuntu-26.04` runner 上测试、打包和发布。

## 数据和安全边界

- 认证文件来自 `CODEX_HOME/auth.json` 或 `~/.codex/auth.json`。
- 不保存 Token、账户 ID、提示词、聊天记录、原始响应或认证文件路径。
- 认证文件读取上限 256 KB，接口响应上限 1 MB；请求不跟随重定向。
- 不兑换重置机会，不修改账户设置。
- 接口为非公开只读接口；字段变化时显示不可用，而不是猜测额度。

## 验证命令

```bash
npm ci
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri dev
npm run tauri:ubuntu
```

浏览器模式只能验证 mock 数据；真实额度、AppIndicator、自动启动、GNOME Wayland/Xorg 定位均需要 Ubuntu 26.04 桌面实机验证。
