# Quota Float

[English](README.md) | [简体中文](README.zh-CN.md)

一款轻量级浮动桌面小组件，通过本机 Codex Desktop 的登录状态查看 Codex 配额。

![Quota Float 配额状态](docs/images/quota-states.png)

## 功能亮点

- 在紧凑的置顶小组件中显示 Codex 套餐、5 小时配额、每周配额和下次重置时间。
- 使用清晰的正常、提醒和紧急状态表示剩余配额。
- 可通过左上角按钮在完整面板和小型浮动圆球之间切换。
- 显示配额当前是否正在消耗。
- 提供语言切换和窗口置顶快捷控制。
- 当面板遮挡 Codex 界面时，可隐藏配额面板并从系统托盘恢复；该设置会在重启后保留。
- 可在 320 × 320 完整面板和 100 × 100 紧凑圆球之间直接切换。在 Windows 上，窗口尺寸和右下角位置会同步更新，所选模式会在重启后保留。
- 面板保持固定，不显示误导性的拖动光标，也不会启动手动窗口拖动；Windows 上的位置会继续跟随 ChatGPT 主窗口。
- 当配额服务提供相关数据时，显示重置额度数量及其可用额度的到期时间。
- 能够处理数据过期、未登录、配额服务不可用和加载中等状态，不会编造配额数值。

## 界面截图

| 配额状态 | 浮动圆球 | 重置额度到期时间 |
| --- | --- | --- |
| ![正常、提醒和紧急配额状态](docs/images/quota-states.png) | ![收起后的配额圆球](docs/images/quota-orb.png) | ![重置额度到期时间弹窗](docs/images/quota-reset-expiration.png) |

## 仓库信息

建议的仓库简介：

```text
用于通过本机 Codex Desktop 登录状态查看 Codex 配额的 Windows/macOS 浮动桌面小组件。
```

建议的仓库主题：

```text
codex, quota, tauri, react, rust, desktop-app, windows, macos, productivity
```

## 工作原理

Quota Float 读取本机已有的 Codex Desktop 登录状态，并使用该会话查询 Codex/ChatGPT 配额接口。它不会根据本地 Token 数量估算用量，也不会使用重置额度或修改账户设置。

浏览器预览模式使用模拟数据。读取真实配额需要运行 Tauri 桌面应用，并且同一台电脑上已经登录 Codex Desktop。

## 下载与安装

普通用户可以从 GitHub Releases 下载最新的未签名版本：

- 最新发行版：https://github.com/Gavinnn102/quota-float/releases/latest
- Windows：`quota-float-windows-unsigned.zip`
- macOS Universal：`quota-float-macos-universal-unsigned.zip`

下载后解压并运行应用。由于安装包尚未签名，Windows SmartScreen 或 macOS Gatekeeper 可能会显示安全提示。面向普通用户公开分发时，建议使用已签名的 Windows 版本和经过公证的 macOS 版本。

### Windows 安装提示

1. 下载并解压 `quota-float-windows-unsigned.zip`。
2. 运行其中的 NSIS 安装程序或 MSI 安装包。
3. 如果 SmartScreen 显示“未知发布者”，请确认文件来自本仓库的正式发行页后，再选择“更多信息”并继续运行。
4. 在同一台电脑上登录 Codex Desktop，然后启动 Quota Float。

### macOS 安装提示

1. 下载并解压 `quota-float-macos-universal-unsigned.zip`。
2. 打开 DMG，或直接运行其中的应用。
3. 如果 Gatekeeper 阻止首次启动，可右键点击应用并选择“打开”，然后在系统提示中再次确认。
4. 如仍被阻止，请前往“系统设置 → 隐私与安全性”允许该应用运行。

## 问题反馈

如需报告错误、兼容性问题或提出功能建议，请使用 GitHub Issues：

https://github.com/Gavinnn102/quota-float/issues

## 隐私边界

Quota Float 采用本地优先设计，并严格限制自身权限范围：

- 仅为查询 Codex 配额而读取本机 Codex Desktop 登录状态。
- 仅将现有 Codex 访问令牌发送至 ChatGPT 配额接口。
- 只在自身应用配置目录中保存小组件偏好设置。
- 不保存 Codex 令牌、账户 ID、提示词、聊天记录、原始配额响应或本地认证路径。
- 不包含遥测、分析、崩溃上报或第三方跟踪。
- 不使用重置额度，也不修改账户设置。

完整说明请参阅 [PRIVACY.md](PRIVACY.md) 和 [SECURITY.md](SECURITY.md)。

## 准确性边界

Codex 配额来自 Codex/ChatGPT 配额服务响应。如果响应格式发生变化，应用会显示不可用或数据过期状态，而不会编造配额数值。

## 开发

环境要求：

- Node.js 20+
- Rust stable
- 当前平台所需的 Tauri 2 系统依赖

```bash
npm install
npm run dev
npm run test
npm run build
npm run tauri dev
```

## 构建

```bash
npm run tauri build
```

在 Windows 上，Tauri 可能会下载 WiX 来生成 MSI 安装包。如果 WiX 下载失败，发行版可执行文件可能仍会生成在：

```text
src-tauri/target/release/quota-float.exe
```

## 发布

GitHub Actions 当前配置为：

- 推送或拉取请求触发 CI：运行前端测试、Rust 测试、Web 构建和 Tauri 构建。
- 推送 `v*` 标签：生成并验证未签名的 Windows 和 macOS Universal 安装包、SHA-256 校验文件，以及供人工审核的 GitHub Release 草稿。

向其他用户发布版本前，请先查看 [docs/GITHUB-RELEASE-CHECKLIST.md](docs/GITHUB-RELEASE-CHECKLIST.md)。

不要将本地凭据、`.codex`、`.env*`、含个人信息的截图、`node_modules`、`dist`、`src-tauri/target` 或本地安装包提交到源代码仓库。

## 许可证

MIT
