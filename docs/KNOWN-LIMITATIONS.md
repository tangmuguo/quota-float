# 已知限制

- Codex 数据来自非公开只读接口，字段、认证方式或访问策略可能变化。
- Windows 与 macOS 保留原有原生发布；Linux 当前只正式支持 Ubuntu 26.04 x86_64 `.deb`，不提供 AppImage 或 RPM。
- Ubuntu 的 ChatGPT 窗口锚定依赖随包 GNOME Shell 扩展，当前支持 GNOME Shell 48–50。被系统策略禁用时无法进行跨应用精确定位。
- GNOME Shell 通常只在登录会话启动时扫描新安装的系统扩展；首次安装、更新或移除后可能需要注销并重新登录。
- Ubuntu 扩展只在 ChatGPT 为活动应用（或用户正在操作组件）时显示组件；应用退出会禁用扩展。
- GNOME 是否显示 AppIndicator 取决于桌面会话；无法显示时仍可从活动概览启动应用。
- XDG autostart 依赖桌面环境遵守 `~/.config/autostart`；部分窗口管理器可能需要用户自行配置。
- CSS 毛玻璃效果取决于平台 WebView、显卡驱动和合成器，像素表现可能不同。
- Claude provider 在 v1 中未启用。
- 重置机会仅展示数量和到期时间，不能在应用内兑换。
- 真实额度准确性依赖 Codex 后端返回的窗口数据；应用不会根据本地 Token 消耗自行估算。
