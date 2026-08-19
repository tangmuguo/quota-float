# Quota Float 0.1.9

Quota Float is a lightweight Ubuntu 26.04 desktop widget for checking Codex quota from an existing local Codex login.

## Downloads

- Ubuntu 26.04 x86_64 Debian package: `quota-float_<version>_amd64.deb`
- SHA-256 checksums: `SHA256SUMS.txt`

## What's new

- Converts the desktop shell to an Ubuntu 26.04-first release.
- Builds one native `.deb` with WebKitGTK 4.1, GTK 3 t64, Ayatana AppIndicator, and XWayland runtime dependencies.
- Adds bottom-right work-area placement, multi-monitor/scale clamping, and a tray action to reset placement.
- Uses GNOME Wayland natively; draggable panel/orb placement is available when the compositor controls initial window coordinates.
- Keeps a taskbar recovery path when the GNOME session does not expose an AppIndicator.
- Persists a user-positioned widget location when the session reports it.

## Install

1. Sign in to Codex on the same Ubuntu 26.04 machine.
2. Download the `.deb` and optionally verify its checksum.
3. Install it with:

   ```bash
   sudo apt install ./quota-float_<version>_amd64.deb
   ```

4. Launch **Quota Float Ubuntu** from Activities or the dock.

## Notes

- This release supports Ubuntu 26.04 x86_64 only.
- GNOME Wayland determines initial regular-window placement. The widget requests the lower-right corner and can be dragged if GNOME selects a different location.
- Codex quota is read from non-public quota-service responses; the app shows stale/unavailable states instead of estimating quota.
- Quota Float stores only widget preferences. It does not persist Codex credentials, account IDs, prompts, chats, raw quota responses, or local auth paths.

## Release checks

- [ ] Frontend tests and web build passed.
- [ ] Rust tests and Clippy passed.
- [ ] Ubuntu 26.04 `.deb` generated and installation-checked.
- [ ] GNOME Wayland and Xorg/XWayland window behavior checked.
- [ ] Version consistency, package contents, SHA-256 hashes, and privacy scan passed.
- [ ] Draft attachments reviewed before publishing.
