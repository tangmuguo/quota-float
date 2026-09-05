# Quota Float 0.1.11

Quota Float is a cross-platform desktop widget for checking Codex quota from an existing local Codex login.

## Downloads

- Windows MSI + NSIS archive: `quota-float-windows-unsigned.zip`
- macOS universal app + DMG archive: `quota-float-macos-universal-unsigned.zip`
- Ubuntu 26.04 x86_64 Debian package: `Quota Float Ubuntu_0.1.11_amd64.deb`
- SHA-256 checksums: `SHA256SUMS.txt`

## What's new

- Adds 5-hour quota alongside weekly quota, matching response windows by duration even when primary/secondary names are swapped.
- Adds checked **5-hour quota** / **Weekly quota** choices to the top-bar tray menu. The choice is saved across restarts; older settings keep weekly quota.
- Updates the full panel and compact orb together, including percentage, color, reset time, and Chinese/English labels.
- Reports a missing selected window without substituting the other window, and handles refresh timing and stale data for both allowances.
- Keeps previous Debian packages when building the new 0.1.11 test package.

## Ubuntu install

```bash
sudo apt install "./Quota Float Ubuntu_0.1.11_amd64.deb"
```

After a first extension install or update, log out and back in once. In a GNOME session, the app makes a best-effort attempt to enable the extension at startup and disable it on a normal exit; it can be disabled manually after a crash or forced termination.

## Release checks

- [ ] Frontend tests and web build passed.
- [ ] Rust formatting, Clippy, and tests passed.
- [ ] Windows MSI/NSIS and macOS universal app/DMG passed.
- [ ] Ubuntu `.deb` dependencies, extension files, unpacked privacy scan, and installation passed.
- [ ] GNOME multi-window anchoring, two-size constraint, tray recovery, refresh, and extension lifecycle passed.
- [ ] 5-hour/weekly tray switching, repeated selection, language switching, compact view, and saved choice after restart passed.
- [ ] Legacy `locked: true` preferences remain interactive and the Unlock widget tray item is absent.
- [ ] Windows/macOS desktop regression passed.
- [ ] Attachment set and `SHA256SUMS.txt` reviewed before publishing.
