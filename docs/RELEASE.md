# 发布说明

## 发布目标

Quota Float 同时保留 Windows、macOS 与 Ubuntu 26.04 发布路径：

- Windows：MSI + NSIS；
- macOS：universal app + DMG；
- Ubuntu 26.04 x86_64：原生 `.deb`（Linux 不生成 AppImage）；
- 全部产物：`SHA256SUMS.txt`。

平台通用配置位于 `src-tauri/tauri.conf.json`，Ubuntu 专用窗口和 Debian 配置位于 `src-tauri/tauri.linux.conf.json`。

## Ubuntu 本地构建

先安装开发依赖：

```bash
sudo apt update
sudo apt install \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

再执行：

```bash
npm ci
npm test
npm run build
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm run tauri:ubuntu
node scripts/verify-ubuntu-deb.mjs
```

产物位于 `src-tauri/target/release/bundle/deb/`。标准化和验证脚本按当前版本选择 `.deb`，因此目录中可以安全保留旧版本测试包。

## Windows 与 macOS 构建

在对应主机运行：

```bash
npm ci
npm test
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm run tauri -- build
```

macOS CI 额外安装 `aarch64-apple-darwin` 与 `x86_64-apple-darwin`，并构建 universal 目标。

## GitHub Release

版本文件必须一致且使用尚未占用的标签，例如当前版本：

```bash
git tag v0.1.10
git push origin v0.1.10
```

发布工作流会：

1. 校验 tag、npm、Cargo、Tauri 和发布模板版本；
2. 扫描源码中的高置信度密钥；
3. 在 Windows、macOS 与 Ubuntu runner 上执行测试、Clippy 和构建；
4. 对 Windows/macOS bundle 扫描本机构建路径；
5. 解包 Ubuntu `.deb`，扫描实际安装文件树中的禁用文件、高置信度密钥和本机构建路径，并核验依赖与扩展文件；
6. 核验三平台附件，生成 SHA-256，创建 Draft Release。

草稿不会自动公开。实机检查完成后再人工发布。

## Ubuntu 26.04 实机检查

1. 使用 `apt install ./package.deb` 安装，确认依赖可解析；首次安装/更新扩展后注销并重新登录。
2. 确认扩展随应用启动而启用、随应用退出而禁用，并测试手动启用/禁用与卸载。
3. 多开 ChatGPT，聚焦不同大小的窗口，确认组件始终跟随当前活动窗口。
4. 验证 ChatGPT 移动、缩放、最小化、恢复和工作区切换。
5. 验证 320 × 320 / 100 × 100 两档切换，确认无法拖到中间尺寸。
6. 关闭组件窗口后，确认托盘勾选取消且第一次点击“显示面板”即可恢复。
7. 在未登录、断网和服务错误状态下确认错误页与托盘“立即刷新”均可恢复。
8. 校验 `sha256sum -c SHA256SUMS.txt`。

## 跨平台发布门槛

- Windows 宿主跟随、MSI 与 NSIS 构建通过；
- macOS universal app 与 DMG 构建通过；
- Ubuntu `.deb`、GNOME Wayland 锚定和扩展生命周期通过；
- 三平台 CI 全部通过，严重和高风险问题清零。
