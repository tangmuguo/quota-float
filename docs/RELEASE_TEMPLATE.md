# Quota Float 0.1.9

Quota Float is a lightweight Ubuntu 26.04 desktop widget for checking Codex quota from an existing local Codex login.

## Downloads

- Ubuntu 26.04 x86_64 Debian package: `quota-float_<version>_amd64.deb`
- SHA-256 checksums: `SHA256SUMS.txt`

## What's new

- Converts the desktop shell to an Ubuntu 26.04-first release.
- Builds one native `.deb` with WebKitGTK 4.1, GTK 3 t64, Ayatana AppIndicator, GNOME Shell runtime dependencies, and the anchor extension.
- Adds GNOME Shell/Mutter anchoring to keep the widget in the active ChatGPT window's lower-right corner.
- Uses GNOME Wayland natively; the extension owns placement so a regular client never requests a rejected cross-application coordinate.
- Resizes only the widget surface, then lets the extension re-anchor its completed frame to prevent resize/position hangs.
- Hides the widget with ChatGPT instead of leaving an unrelated desktop overlay.

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
- The bundled GNOME Shell extension anchors the widget to the active ChatGPT window; no client-side drag or coordinate request is used.
- Codex quota is read from non-public quota-service responses; the app shows stale/unavailable states instead of estimating quota.
- Quota Float stores only widget preferences. It does not persist Codex credentials, account IDs, prompts, chats, raw quota responses, or local auth paths.

## Release checks

- [ ] Frontend tests and web build passed.
- [ ] Rust tests and Clippy passed.
- [ ] Ubuntu 26.04 `.deb` generated and installation-checked.
- [ ] GNOME Wayland anchor behavior checked with ChatGPT movement, resize, workspace changes, and panel-size toggles.
- [ ] Version consistency, package contents, SHA-256 hashes, and privacy scan passed.
- [ ] Draft attachments reviewed before publishing.
