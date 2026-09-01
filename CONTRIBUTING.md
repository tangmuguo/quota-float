# Contributing

Thanks for helping improve Quota Float.

## Before Opening Issues

Do not paste tokens, account IDs, raw backend responses, local auth paths, or screenshots containing personal data.

## Development

Use Node.js 20.19+ or 22.12+ and Rust stable. Before submitting a change, run:

```bash
npm ci
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --locked --manifest-path src-tauri/Cargo.toml
```

Use `npm run tauri -- dev` for desktop testing on the current platform. Ubuntu GNOME anchoring and the Debian package still require Ubuntu 26.04; browser preview uses mock data and cannot verify real quota reads.

For an Ubuntu `.deb`, install the dependencies in `docs/RELEASE.md`, remap local build paths with `RUSTFLAGS`, and run `npm run tauri:ubuntu`. That command builds, normalizes, and verifies the package.

## Pull Requests

- Keep changes small and focused.
- Preserve the privacy boundary documented in `PRIVACY.md`.
- Do not add telemetry or raw response logging.
- Add or update tests when changing quota parsing, snapshot merging, or formatting.
- Update both README languages and the relevant release, privacy, or test documentation when behavior, dependencies, or artifacts change.
