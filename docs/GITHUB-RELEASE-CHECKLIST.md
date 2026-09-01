# GitHub 发布与分享清单

## CI 环境

GitHub Actions 必须允许以下三类桌面 job 运行：

- `windows-latest`：MSI 与 NSIS；
- `macos-latest`：universal app 与 DMG；
- `ubuntu-26.04`：Ubuntu 26.04 x86_64 `.deb` 与 GNOME 扩展。

若 Actions 显示“等待维护者批准”，不得把它视为通过。

## 版本与标签

- [ ] `package.json`、`package-lock.json`、`Cargo.toml`、`Cargo.lock`、`tauri.conf.json` 和发布模板版本一致，双语 README 与发布指南引用当前 `.deb` 文件名。
- [ ] 标签尚未存在，且与版本完全匹配；当前示例为 `v0.1.10`。
- [ ] `node scripts/verify-release-version.mjs` 通过。

## 自动门禁与本地质量检查

- [ ] 前端测试、Web build 与依赖审计通过。
- [ ] 发布前本地 `cargo fmt --check` 通过；Release jobs 的 Clippy 与 Rust 测试通过。
- [ ] Windows 和 macOS 原生 bundle 构建通过。
- [ ] Ubuntu `.deb` 构建、依赖字段和扩展文件检查通过。
- [ ] `.deb` 已解包扫描实际文件内容和路径，而不是只扫描压缩包字符串。
- [ ] Windows/macOS bundle 不包含本机构建路径。
- [ ] Release 草稿包含且只包含一个 Windows zip、一个 macOS zip、一个 `.deb` 和 `SHA256SUMS.txt`。

## 实机验证

- [ ] Windows：ChatGPT/Codex 宿主跟随、显示/隐藏、MSI/NSIS 安装。
- [ ] macOS：universal app、DMG、托盘与显示/隐藏。
- [ ] Ubuntu：`apt install`、GNOME 扩展启停/卸载、Wayland 多窗口锚定、两档尺寸、托盘关闭恢复、手动刷新。
- [ ] 偏好升级：旧 `locked: true` 被忽略，窗口可交互，托盘不再包含“解锁悬浮窗”。
- [ ] 三个平台都验证除已退役 `locked` 字段外的现有设置在升级后保持不变。

## 发布附件

- `quota-float-windows-unsigned.zip`
- `quota-float-macos-universal-unsigned.zip`
- `Quota Float Ubuntu_<version>_amd64.deb`
- `SHA256SUMS.txt`

草稿附件、哈希、隐私扫描和实机结果全部确认后再点击 Publish release。
