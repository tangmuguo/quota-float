# Quota Float for Ubuntu 26.04

[English](README.md) | [简体中文](README.zh-CN.md)

An Ubuntu 26.04 desktop widget that reads the existing local Codex login state and shows the remaining Codex quota at a glance.

![Quota Float quota states](docs/images/quota-states.png)

## Ubuntu-first behavior

- Targets Ubuntu 26.04 LTS on x86_64 and ships as a native Debian package (`.deb`).
- Uses the Ubuntu/GTK runtime stack (`WebKitGTK 4.1`, GTK 3 t64, Ayatana AppIndicator) instead of an AppImage.
- Requests a 24 px bottom-right work-area placement on launch and whenever the panel changes size. It is exact on Ubuntu on Xorg/XWayland.
- Keeps the Wayland-native WebKit path on GNOME Wayland. GNOME intentionally controls client window placement there, so the widget provides a drag region and remembers a reported position instead of forcing an unstable XWayland fallback.
- Starts as an always-on-top, all-workspaces widget and keeps a normal taskbar entry, so the panel can be restored even when a GNOME session does not expose an AppIndicator.
- Includes a tray action to move the widget back to the bottom-right corner, refresh quota, unlock click-through, switch language, configure login autostart, and quit.

## What it shows

- Codex plan, weekly remaining quota, next reset time, and reset-credit information when the service provides it.
- Healthy, caution, critical, stale, signed-out, and unavailable states.
- A 320 × 320 full panel and a 100 × 100 compact quota orb.
- Persistent preferences for panel size, visibility, click-through, always-on-top behavior, language, and a user-positioned location.

## Install

Download the Ubuntu 26.04 `.deb` from the release page, then install it with `apt` so runtime dependencies are resolved:

```bash
sudo apt install ./quota-float_*_amd64.deb
```

Sign in to Codex on the same machine before starting Quota Float. If the widget is minimized or an indicator is not visible, launch **Quota Float Ubuntu** again from the dock or Activities overview to restore it.

The package declares the Ubuntu 26.04 runtime dependencies it needs, including `libwebkit2gtk-4.1-0`, `libgtk-3-0t64`, `libayatana-appindicator3-1`, and `xwayland`.

## Placement on GNOME Wayland

Wayland compositors do not let regular applications dictate an exact screen coordinate. Quota Float therefore requests the lower-right placement and remains usable if GNOME chooses a different initial position.

To place it yourself, drag the heading area of the full panel or the compact orb. The app remembers the reported position when the session supports it. Use **Move to bottom right / 移动至右下角** in the tray menu to clear that remembered position and request the default placement again.

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
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  xwayland
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
