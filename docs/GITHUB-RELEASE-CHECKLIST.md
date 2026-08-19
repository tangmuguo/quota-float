# GitHub 发布与分享清单（Ubuntu 26.04）

## 本地准备

- Ubuntu 26.04 x86_64
- Git、Node.js 20+、Rust stable
- Tauri 的 Ubuntu 26.04 开发依赖（见根目录 README）
- 已通过 `npm ci` 安装前端依赖

GitHub 需要一个仓库，并启用 GitHub Actions。工作流使用 `ubuntu-26.04` runner，不需要 Windows 或 macOS 构建机。

## 第一次上传到 GitHub

若仓库尚无 remote：

```bash
git remote add origin https://github.com/<owner>/<repo>.git
git branch -M main
git add .
git commit -m "Prepare Ubuntu 26.04 release"
git push -u origin main
```

若已有 remote：

```bash
git add .
git commit -m "Prepare Ubuntu 26.04 release"
git push origin main
```

## 生成可分享版本

推送与版本一致的标签：

```bash
git tag v0.1.9
git push origin v0.1.9
```

工作流成功后会创建 draft release，附件应包含：

- 一个 `quota-float_<version>_amd64.deb`
- `SHA256SUMS.txt`

先核对版本、SHA-256、隐私扫描和 Ubuntu 26.04 实机安装结果，再点击 Publish release。

## 发给 Ubuntu 用户的安装说明

1. 下载 `.deb` 和 `SHA256SUMS.txt`。
2. 可选：在下载目录执行 `sha256sum -c SHA256SUMS.txt`。
3. 使用 `sudo apt install ./quota-float_<version>_amd64.deb` 安装，不要只使用 `dpkg -i`。
4. 在同一台电脑登录 Codex 后，从应用列表启动 Quota Float Ubuntu。
5. 确认 `quota-float-anchor@quotafloat.app` 已启用，并在 ChatGPT 前台时将组件锚定到其右下角。

## 发布前确认

- [ ] 前端测试和 Web build 通过。
- [ ] Rust 测试和 Clippy 通过。
- [ ] Ubuntu 26.04 `.deb` 已生成且依赖字段正确。
- [ ] GNOME Wayland 完成安装、扩展启用和 ChatGPT 窗口行为检查。
- [ ] 显示/隐藏、AppIndicator（若可用）、开机启动和语言切换已验证。
- [ ] 版本一致性、包内容、SHA-256 和隐私扫描通过。
