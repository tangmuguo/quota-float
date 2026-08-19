# Ubuntu 26.04 发布说明

## 发布目标

Quota Float 此分支仅发布 Ubuntu 26.04 x86_64 的原生 `.deb`。不构建 Windows、macOS、RPM 或 AppImage。

选择 `.deb` 是为了直接使用 Ubuntu 26.04 的 WebKitGTK 2.52、GTK 3 t64、Wayland、Ayatana AppIndicator 和 GNOME Shell 运行时；避免 AppImage 将旧的 GTK/Wayland/GStreamer 组件带入现代 Ubuntu 会话。

发布产物：

- `quota-float_<version>_amd64.deb`
- `SHA256SUMS.txt`

## 本地构建

在 Ubuntu 26.04 安装开发依赖后运行：

```bash
npm ci
npm test
npm run build
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm run tauri:ubuntu
```

生成的安装包位于：

```text
src-tauri/target/release/bundle/deb/
```

安装验证使用：

```bash
sudo apt install ./src-tauri/target/release/bundle/deb/quota-float_*_amd64.deb
```

## GitHub Release

推送 `v*` tag 将触发 `.github/workflows/release.yml`：

```bash
git tag v0.1.9
git push origin v0.1.9
```

工作流固定使用 `ubuntu-26.04` runner，并执行：

- 版本一致性和高置信度密钥扫描；
- 前端测试、构建和依赖审计；
- Rust Clippy 与单元测试；
- Ubuntu 系统依赖安装；
- `.deb` 构建、运行时依赖检查、本机构建路径扫描和包内容扫描；
- SHA-256 生成与 GitHub Draft Release 创建。

草稿 Release 不会自动公开。完成实机安装检查后，再在 GitHub 中人工发布。

## Ubuntu 26.04 实机检查

1. 使用 `apt install ./package.deb` 安装，确认依赖被正确解析；注销并重新登录，让 GNOME Shell 扫描随包扩展。
2. 在已登录 Codex 的账户中启动，确认额度读取和错误状态不会泄露敏感数据。
3. 在 GNOME Wayland 中确认 `quota-float-anchor@quotafloat.app` 已启用，组件可点击且位于活动 ChatGPT 窗口右下角。
4. 确认 ChatGPT 的移动、缩放、最小化、恢复、工作区切换以及面板收起/展开都会保持正确锚定。
5. 检查 AppIndicator 可用时的菜单，以及显示/隐藏恢复路径。
6. 切换开机启动并重新登录，检查 XDG autostart 行为。
7. 校验 `sha256sum -c SHA256SUMS.txt`。

## 维护原则

- 默认使用 Ubuntu 26.04 原生 Wayland 路径，由 GNOME Shell 扩展完成 ChatGPT 窗口锚定。
- 平台相关逻辑只保留在 `src-tauri/src/ubuntu_host.rs` 与 Tauri 壳层。
- 前端视觉调整继续放在共享 React/CSS 层。
- 不增加遥测、令牌存储、原始响应日志或账号设置写操作。
