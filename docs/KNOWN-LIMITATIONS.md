# 已知限制

- Codex 数据来自非公开只读接口，字段、认证方式或访问策略可能变化。
- 当前版本仅面向 Ubuntu 26.04 x86_64；不提供 Windows、macOS、AppImage 或 RPM 安装包。
- GNOME Wayland 不允许普通应用强制使用精确屏幕坐标。应用会请求右下角位置，但最终由合成器决定；Ubuntu Xorg/XWayland 下可精确定位。
- GNOME 是否显示 AppIndicator 取决于桌面会话和扩展。应用保留任务栏入口和单实例恢复路径，不能只依赖托盘图标。
- XDG autostart 依赖桌面环境遵守 `~/.config/autostart`；某些平铺窗口管理器可能需要用户自行配置启动项。
- CSS 毛玻璃效果取决于 WebKitGTK、显卡驱动和合成器；功能优先于所有桌面下的像素级一致性。
- Claude provider 在 v1 中未启用。
- 重置机会仅展示数量和到期时间，不能在应用内兑换。
- 真实额度准确性依赖 Codex 后端返回的窗口数据；应用不会根据本地 Token 消耗自行估算。
