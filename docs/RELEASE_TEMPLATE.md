# Quota Float 0.1.10

Quota Float is a cross-platform desktop widget for checking Codex quota from an existing local Codex login.

## Downloads

- Windows MSI + NSIS archive: `quota-float-windows-unsigned.zip`
- macOS universal app + DMG archive: `quota-float-macos-universal-unsigned.zip`
- Ubuntu 26.04 x86_64 Debian package: `Quota Float Ubuntu_0.1.10_amd64.deb`
- SHA-256 checksums: `SHA256SUMS.txt`

## What's new

- Adds Ubuntu 26.04 as a platform-specific path without removing Windows or macOS builds.
- Restores the Windows ChatGPT/Codex host integration and three-platform CI/release jobs.
- Anchors Ubuntu to the focused ChatGPT window and recognizes multi-field Codex identities.
- Constrains Ubuntu to the 320 × 320 and 100 × 100 native modes.
- Synchronizes close-to-hide with the tray state and restores manual refresh on all error states and the tray.
- Removes the retired click-through/lock flow and the obsolete Unlock widget tray item while safely ignoring legacy `locked` preferences.
- Documents and enforces the GNOME extension lifecycle and metadata boundary.
- Extracts the Ubuntu `.deb` and scans the installed file tree before release.

## Ubuntu install

```bash
sudo apt install "./Quota Float Ubuntu_0.1.10_amd64.deb"
```

After a first extension install or update, log out and back in once. In a GNOME session, the app makes a best-effort attempt to enable the extension at startup and disable it on a normal exit; it can be disabled manually after a crash or forced termination.

## Release checks

- [ ] Frontend tests and web build passed.
- [ ] Rust formatting, Clippy, and tests passed.
- [ ] Windows MSI/NSIS and macOS universal app/DMG passed.
- [ ] Ubuntu `.deb` dependencies, extension files, unpacked privacy scan, and installation passed.
- [ ] GNOME multi-window anchoring, two-size constraint, tray recovery, refresh, and extension lifecycle passed.
- [ ] Legacy `locked: true` preferences remain interactive and the Unlock widget tray item is absent.
- [ ] Windows/macOS desktop regression passed.
- [ ] Attachment set and `SHA256SUMS.txt` reviewed before publishing.
