# 已知限制

- Codex 数据来自非公开只读接口，字段、认证方式或访问策略可能变化。
- 当前版本仅面向 Ubuntu 26.04 x86_64；不提供 Windows、macOS、AppImage 或 RPM 安装包。
- ChatGPT 窗口锚定依赖随包安装的 GNOME Shell 扩展，当前支持 GNOME Shell 48–50。若扩展被策略禁用，组件不会获得跨应用精确定位能力。
- GNOME Shell 只在登录会话启动时扫描新安装的系统扩展；首次安装或扩展更新后需要注销并重新登录一次。
- 扩展只在 ChatGPT 为活动应用（或用户正在操作组件）时显示组件；这比独立桌面置顶窗更接近 Windows 版的宿主窗口行为。
- GNOME 是否显示 AppIndicator 取决于桌面会话和扩展；可使用“活动概览”启动应用，扩展会在 ChatGPT 回到前台时重新锚定它。
- XDG autostart 依赖桌面环境遵守 `~/.config/autostart`；某些平铺窗口管理器可能需要用户自行配置启动项。
- CSS 毛玻璃效果取决于 WebKitGTK、显卡驱动和合成器；功能优先于所有桌面下的像素级一致性。
- Claude provider 在 v1 中未启用。
- 重置机会仅展示数量和到期时间，不能在应用内兑换。
- 真实额度准确性依赖 Codex 后端返回的窗口数据；应用不会根据本地 Token 消耗自行估算。
