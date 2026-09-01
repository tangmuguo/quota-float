# Quota Float 项目简介

## 定位

Quota Float 是一个跨平台 Tauri 2 Codex 额度组件。它通过本机已有登录态只读查询额度，并用卡片或紧凑圆球显示周额度、重置时间、重置机会和套餐类型。

## 平台架构

- 共享层：React 19、TypeScript、Vite、Rust、`reqwest`、偏好、托盘和额度解析。
- Windows：`src-tauri/src/codex_host.rs` 负责原生 ChatGPT/Codex 宿主跟随；发布 MSI/NSIS。
- macOS：使用共享窗口路径；发布 universal app/DMG。
- Ubuntu 26.04：`src-tauri/src/ubuntu_host.rs` 与 `src-tauri/gnome-extension/` 负责 GNOME Wayland 尺寸和锚定；发布 `.deb`。

平台通用 Tauri 配置位于 `src-tauri/tauri.conf.json`；Linux 专用覆盖位于 `src-tauri/tauri.linux.conf.json`，因此 Ubuntu 支持不会替换其他平台。

## Ubuntu 行为

- 扩展选择当前聚焦的 ChatGPT 窗口；组件获得焦点时保留刚才的宿主。
- 身份字段逐项识别，可处理多个字段同时包含 `codex` 的窗口。
- 组件只允许 320 × 320 和 100 × 100 两种原生尺寸。
- 关闭窗口会持久化隐藏状态并同步托盘勾选；首次点击“显示面板”即可恢复。
- 应用在 GNOME 会话启动时尽力启用扩展，并在正常退出时尝试禁用；扩展仅操作 Quota Float 窗口。
- 托盘保留显示/隐藏、刷新、语言、开机启动和退出；已移除鼠标穿透/锁定功能与“解锁悬浮窗”，旧配置中的 `locked` 字段会被忽略并在后续保存时移除。

## 恢复与发布门禁

- 错误页和托盘均提供手动刷新，绕过最长 30 分钟自动退避等待。
- Windows、macOS 与 Ubuntu CI 均保留。
- Ubuntu `.deb` 在上传前会被解包，扫描实际安装树中的禁用文件、密钥模式和本机构建路径。
- 当前版本为 0.1.10，避免与已有 `v0.1.9` 标签冲突。

## 数据和安全边界

- 认证文件来自 `CODEX_HOME/auth.json` 或 `~/.codex/auth.json`。
- 不保存 Token、账户 ID、提示词、聊天记录、原始响应或认证文件路径。
- 认证文件读取上限 256 KB，接口响应上限 1 MB；请求不跟随重定向。
- 不兑换重置机会，不修改账户设置。

## 验证命令

```bash
node scripts/verify-release-version.mjs
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml
export RUSTFLAGS="--remap-path-prefix=$PWD=/src --remap-path-prefix=$HOME=/build"
npm run tauri:ubuntu
```
