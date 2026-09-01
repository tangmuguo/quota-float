# Quota Float

[English](README.md) | [简体中文](README.zh-CN.md)

A small cross-platform desktop widget that reads the existing local Codex login state and displays remaining quota, reset time, and reset-credit information.

![Quota Float quota states](docs/images/quota-states.png)

## Platform support

- **Windows:** preserves the native ChatGPT/Codex host-following implementation and produces MSI and NSIS installers.
- **macOS:** produces universal Apple Silicon/Intel app and DMG bundles.
- **Ubuntu 26.04 x86_64:** produces a native `.deb` and uses a bundled GNOME Shell extension to anchor the widget to the active ChatGPT window under Wayland.

Ubuntu support is an additional platform path. Shared React, quota, preference, tray, and release logic remains available to Windows and macOS.

## What it shows

- Codex plan, weekly remaining quota, next reset time, and reset-credit information when the service provides it.
- Healthy, caution, critical, stale, signed-out, and unavailable states.
- A 320 × 320 full panel and a 100 × 100 compact quota orb.
- Persistent preferences for panel visibility/size, always-on-top, language, and provider rotation.
- Manual refresh from error states and the tray, so recovery is not blocked by automatic retry backoff.

## Ubuntu installation

Download the Ubuntu 26.04 `.deb`, then install it with `apt` so runtime dependencies are resolved:

```bash
sudo apt install ./quota-float_*_amd64.deb
```

Sign in to Codex on the same machine first. After the initial extension install or update, log out and back in once so GNOME Shell can scan it. Quota Float enables the extension when the app starts and disables it when the app exits. It can also be controlled manually:

```bash
gnome-extensions disable quota-float-anchor@quotafloat.app
gnome-extensions enable quota-float-anchor@quotafloat.app
```

Uninstalling the package removes the app and extension files:

```bash
sudo apt remove quota-float-ubuntu
```

The package declares Ubuntu 26.04 runtime dependencies including `libwebkit2gtk-4.1-0`, `libgtk-3-0t64`, `libayatana-appindicator3-1`, and GNOME Shell 48 or newer.

## GNOME Wayland placement

Wayland prevents an ordinary app from forcing an arbitrary cross-application coordinate. Quota Float therefore delegates placement to a small local GNOME Shell extension. The extension selects the focused ChatGPT window, keeps the widget 24 px from its lower-right corner, and preserves that host while the user interacts with the widget.

The Linux window remains technically resizable so GTK accepts programmatic mode changes, but its native minimum and maximum are pinned to the selected 320 × 320 or 100 × 100 mode. Intermediate manual sizes are not allowed.

To identify the two windows, the extension examines limited identity, focus, workspace, minimized-state, and frame metadata from GNOME's top-level window list. It does not read window contents or use network access. See [PRIVACY.md](PRIVACY.md) for the exact boundary and lifecycle.

## How quota access works

Quota Float reads one existing local login file:

- `$CODEX_HOME/auth.json`, when `CODEX_HOME` is set;
- otherwise `~/.codex/auth.json`.

It uses that existing session only to call the Codex/ChatGPT quota endpoints. It does not estimate quota from token counts, redeem reset credits, change account settings, or save credentials. Browser preview uses mock data; real quota reads require the Tauri desktop app and a local Codex login.

## Development

Install Node.js 20+, Rust stable, and project dependencies, then run:

```bash
npm ci
npm test
npm run build
cargo test --locked --manifest-path src-tauri/Cargo.toml
npm run tauri dev
```

Ubuntu 26.04 additionally needs the Tauri GTK/WebKit development packages listed in [the release guide](docs/RELEASE.md).

## Build

Build the native bundles for the current Windows or macOS host with:

```bash
npm run tauri -- build
```

Build the Ubuntu Debian package with:

```bash
npm run tauri:ubuntu
```

The Ubuntu package is written under `src-tauri/target/release/bundle/deb/`. Linux intentionally targets `.deb` instead of AppImage; that Linux-specific choice does not remove Windows or macOS bundles.

## Release

CI covers the shared frontend plus Windows, macOS, and Ubuntu desktop builds. A matching `v*` tag creates a draft release containing:

- a Windows archive with one MSI and one NSIS installer;
- a macOS archive with one universal app and one DMG;
- one Ubuntu 26.04 `.deb`;
- `SHA256SUMS.txt`.

The Ubuntu gate extracts the `.deb` and scans the installed file tree for forbidden files, high-confidence secrets, and local build paths before upload. See [docs/RELEASE.md](docs/RELEASE.md) before publishing.

## License

MIT
