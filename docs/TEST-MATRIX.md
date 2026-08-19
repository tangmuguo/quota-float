# Ubuntu 26.04 测试矩阵

| 范围 | 场景 | 预期 | 状态 |
| --- | --- | --- | --- |
| 数据 | Codex 正常登录 | 显示真实周额度、会员类型、重置时间和可用的重置机会 | 待 Ubuntu 26.04 实机验证 |
| 数据 | 未登录、过期、401/403/429、断网 | 不泄露响应或 Token；显示安全错误并按退避策略重试 | 解析/快照单元测试覆盖；待桌面验证 |
| 登录态 | `CODEX_HOME/auth.json` | 可读取自定义 Codex 目录中的登录态 | 待实机验证 |
| 登录态 | `~/.codex/auth.json` | 可读取默认 Codex 登录态 | 待实机验证 |
| GNOME Wayland | 原生 Wayland 会话 | Shell 扩展启用后，组件贴靠活动 ChatGPT 窗口右下角；WebView 可点击、透明窗口可用 | 待实机验证 |
| GNOME Shell | ChatGPT 移动、缩放、最小化、恢复和工作区切换 | 组件跟随窗口；ChatGPT 不在前台时不残留为桌面中间的独立悬浮窗 | 待实机验证 |
| 面板 | 320 × 320 / 100 × 100 切换 | 原生尺寸先更新，扩展再按已更新的 frame 重新锚定；快速点击被串行化且不会卡死 | 前端/Rust 单元测试覆盖；待实机验证 |
| AppIndicator | Ubuntu Desktop 带指示器扩展 | 显示/隐藏、刷新、解锁、语言、自启动和退出可用 | 待实机验证 |
| 自启动 | XDG autostart | 登录后启动，扩展会在 ChatGPT 前台时重新锚定组件 | 待实机验证 |
| 构建 | Ubuntu 26.04 `.deb` | 只生成一个 `.deb`，声明 WebKitGTK、GTK t64、Ayatana、GNOME Shell 依赖，并包含扩展文件 | CI/release 配置已覆盖 |
| 安装 | `sudo apt install ./package.deb` | 依赖可解析、桌面启动器可用、升级不丢失用户配置 | 待实机验证 |
| 隐私 | 源码和 `.deb` 扫描 | 无 Token、账号 ID、原始响应、本机构建路径或开发产物 | release workflow 覆盖；待产物验证 |

## 发布门槛

- 前端测试、前端构建、Rust 测试和 Clippy 通过。
- Ubuntu 26.04 CI 成功生成 `.deb`。
- 在 Ubuntu 26.04 GNOME Wayland 完成安装、扩展启用、刷新、ChatGPT 窗口锚定、缩放、托盘恢复和自启动检查。
- `.deb` 的依赖、版本、SHA-256 和内容扫描通过。
- 严重和高风险问题清零。
