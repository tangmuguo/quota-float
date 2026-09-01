# 测试矩阵

| 平台/范围 | 场景 | 预期 | 自动化 |
| --- | --- | --- | --- |
| 共享数据 | 正常、未登录、过期、401/403/429、断网 | 不泄露响应或 Token；显示正确状态；支持手动刷新 | Vitest/Rust |
| Windows | ChatGPT/Codex 宿主移动、缩放、最小化 | 组件继续跟随宿主 | Windows CI 构建；待实机 |
| Windows | MSI/NSIS | 两种安装包均生成 | Windows CI |
| macOS | universal app/DMG | Apple Silicon/Intel 通用产物生成 | macOS CI |
| Ubuntu GNOME | 多个不同大小 ChatGPT 窗口 | 跟随当前聚焦窗口，而非最大窗口 | 纯逻辑测试；待实机 |
| Ubuntu GNOME | 多个身份字段含 `codex` | 正确识别，不误最小化组件 | Vitest |
| Ubuntu 面板 | 320/100 切换和手动拖边 | 只允许两档尺寸，偏好与 React 模式一致 | Rust 配置测试；待实机 |
| Ubuntu 托盘 | 关闭窗口后首次点击显示 | 勾选同步，第一次点击即恢复 | 代码路径；待实机 |
| Ubuntu 扩展 | 启动、退出、手动禁用、卸载 | 启动启用、退出禁用、卸载移除文件 | 包内容检查；待实机 |
| Ubuntu 构建 | `.deb` | 依赖与 GNOME 扩展文件正确 | Ubuntu CI |
| 隐私 | `.deb` 解包扫描 | 实际安装树无禁用文件、密钥或本机构建路径 | `verify-ubuntu-deb.mjs` |
| 发布 | 三平台附件 | Windows zip、macOS zip、`.deb`、SHA-256 齐全 | release workflow |

## 发布门槛

- 前端测试、Web build、Rust 格式、Clippy 与测试通过。
- Windows、macOS、Ubuntu 三个平台的 CI job 全部通过；等待维护者批准不算通过。
- Ubuntu 26.04 GNOME Wayland 完成锚定、两档尺寸、托盘恢复、刷新和扩展生命周期实测。
- Windows/macOS 完成真实桌面安装与基本回归。
- `.deb` 版本、依赖、文件、SHA-256 和解包内容扫描通过。
