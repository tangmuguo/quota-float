# Quota Float for Ubuntu 26.04

[English](README.md) | [简体中文](README.zh-CN.md)

An Ubuntu 26.04 widget that reads the existing local Codex login state and shows the remaining Codex quota in the lower-right corner of the ChatGPT desktop window.

![Quota Float quota states](docs/images/quota-states.png)

## Ubuntu-first behavior

- Targets Ubuntu 26.04 LTS on x86_64 and ships as a native Debian package (`.deb`).
- Uses the Ubuntu/GTK runtime stack (`WebKitGTK 4.1`, GTK 3 t64, Ayatana AppIndicator) instead of an AppImage.
- Uses a packaged GNOME Shell extension to anchor the widget 24 px from the active ChatGPT window's lower-right corner. This works in the native GNOME Wayland session instead of relying on a client-side position request that Mutter can reject.
- Follows the ChatGPT window as it moves, resizes, changes workspace, minimizes, and restores. The widget is not a free-floating all-workspaces desktop overlay.
- Changes panel size in a size-only native transaction. The Shell extension moves the already-resized frame on its next compositor tick, avoiding the resize-and-reposition hang seen on Wayland.
- Includes tray controls for show/hide, refresh, unlock click-through, switch language, configure login autostart, and quit.

## What it shows

- Codex plan, weekly remaining quota, next reset time, and reset-credit information when the service provides it.
- Healthy, caution, critical, stale, signed-out, and unavailable states.
- A 320 × 320 full panel and a 100 × 100 compact quota orb.
- Persistent preferences for panel size, visibility, click-through behavior, language, and provider rotation.

## Install

Download the Ubuntu 26.04 `.deb` from the release page, then install it with `apt` so runtime dependencies are resolved:

```bash
sudo apt install ./quota-float_*_amd64.deb
```

Sign in to Codex on the same machine first. After the initial `.deb` install or an extension update, log out and back in once so GNOME Shell can scan the system extension, then start Quota Float; the app enables it for the current user. If it was disabled manually, restore it with:

```bash
gnome-extensions enable quota-float-anchor@quotafloat.app
```

The package declares the Ubuntu 26.04 runtime dependencies it needs, including `libwebkit2gtk-4.1-0`, `libgtk-3-0t64`, `libayatana-appindicator3-1`, and GNOME Shell 48 or newer.

## Placement on GNOME Wayland

Wayland correctly prevents an ordinary app from embedding itself in another app or forcing an arbitrary screen coordinate. Quota Float therefore delegates only this placement task to its small, local GNOME Shell extension. The extension identifies the Quota Float and ChatGPT desktop windows, then moves the existing Quota Float frame to the ChatGPT frame's lower-right corner. It neither reads window contents nor uses network access.

The widget is visible while ChatGPT is the active desktop app (or while you interact with the widget itself), follows panel size changes automatically, and hides with ChatGPT rather than remaining in the middle of the desktop. GNOME Shell versions 48–50 are supported by the bundled extension.

## How it works

Quota Float reads one existing local login file:

- `$CODEX_HOME/auth.json`, when `CODEX_HOME` is set;
- otherwise `~/.codex/auth.json`.

It uses that existing session only to call the Codex/ChatGPT quota endpoints. It does not estimate quota from token counts, redeem reset credits, change account settings, or save credentials.

Browser preview uses mock data. Real quota reads require the packaged Tauri desktop app and a local Codex login.

## Development

Install Ubuntu 26.04 development dependencies once:

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

Then install Node.js 20+, Rust stable, and project dependencies:

```bash
npm ci
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri dev
```

## Build

Create the Ubuntu package with:

```bash
npm run tauri:ubuntu
```

The result is written under:

```text
src-tauri/target/release/bundle/deb/
```

The repository intentionally builds only a `.deb`: current AppImage packaging can conflict with Ubuntu 26.04's modern Wayland, Mesa, GLib, and WebKitGTK stack.

## Privacy and accuracy

- Only widget preferences are stored in the app configuration directory.
- Tokens, account IDs, prompts, chats, raw quota responses, and auth paths are not stored or logged.
- The quota service is not a public stable API. If the login or response format changes, the widget shows a safe unavailable or stale state instead of inventing a value.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md) for the complete boundary.

## Release

GitHub Actions validates and packages this Ubuntu 26.04 build on the `ubuntu-26.04` runner. Pushing a `v*` tag creates a draft release containing one `.deb` and `SHA256SUMS.txt`.

See [docs/RELEASE.md](docs/RELEASE.md) before publishing.

## License

MIT
