# Quota Float 0.1.12

Quota Float is a cross-platform desktop widget for checking Codex quota from an existing local Codex login.

## Downloads

- Windows MSI + NSIS archive: `quota-float-windows-unsigned.zip`
- macOS universal app + DMG archive: `quota-float-macos-universal-unsigned.zip`
- Ubuntu 26.04 x86_64 Debian package: `Quota Float Ubuntu_0.1.12_amd64.deb`
- SHA-256 checksums: `SHA256SUMS.txt`

## What's new

- Keeps the 320 × 320 full panel 24 px from the lower-right corner of its ChatGPT host in GNOME desktop coordinates.
- Moves the 100 × 100 compact orb upward by 136 logical px from the default 24 px bottom anchor, while keeping a 24 px right desktop-coordinate margin, when the host is neither fullscreen nor fully maximized. With an effective geometry scale of 1 this is a 160 px bottom margin; other scale and coordinate modes convert the offset using the widget's own geometry.
- Restores the compact orb to the default 24 px desktop-coordinate bottom margin for fullscreen or fully maximized hosts. Half-screen/tiled and single-axis-maximized hosts keep the compact avoidance, and very short hosts clamp the orb to the top edge.
- Keeps the same logical offset across fractional scaling and display changes through window-geometry conversion.
- Derives placement from host frame geometry and fullscreen/maximized state without reading window contents or performing pixel recognition.
- Retains the existing 0.1.9, 0.1.10, and 0.1.11 Debian test packages unchanged when the 0.1.12 package is built.

## Ubuntu install

```bash
sudo apt install "./Quota Float Ubuntu_0.1.12_amd64.deb"
```

After a first extension install or update, log out and back in once. In a GNOME session, the app makes a best-effort attempt to enable the extension at startup and disable it on a normal exit; it can be disabled manually after a crash or forced termination.

## Release checks

- [ ] Frontend tests and web build passed.
- [ ] Rust formatting, Clippy, and tests passed.
- [ ] Windows MSI/NSIS and macOS universal app/DMG passed.
- [ ] Ubuntu `.deb` dependencies, extension files, unpacked privacy scan, and installation passed.
- [ ] GNOME multi-window anchoring, two-size constraint, compact 136 logical px offset from the default 24 px desktop-coordinate anchor, tray recovery, refresh, and extension lifecycle passed.
- [ ] Compact placement was checked for ordinary, fullscreen, fully maximized, half-screen/tiled, single-axis-maximized, and very short hosts.
- [ ] Fractional scaling, cross-display movement, and display/workspace changes preserve the compact offset (interaction check pending).
- [ ] 5-hour/weekly tray switching, repeated selection, language switching, compact view, and saved choice after restart passed.
- [ ] Legacy `locked: true` preferences remain interactive and the Unlock widget tray item is absent.
- [ ] Windows/macOS desktop regression passed.
- [ ] Existing 0.1.9, 0.1.10, and 0.1.11 Debian packages and checksums remain unchanged.
- [ ] Attachment set and `SHA256SUMS.txt` reviewed before publishing.
