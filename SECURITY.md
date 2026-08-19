# Security

## Supported Use

Quota Float is a local desktop utility that reads Codex quota using the user's existing Codex Desktop login state.

## Reporting Issues

Please do not open public issues containing tokens, account IDs, raw backend responses, screenshots with personal data, or local file paths. Redact sensitive information before sharing logs or bug reports.

## Security Boundaries

- The app does not persist Codex credentials.
- The app does not log request headers or raw quota responses.
- The app caps auth file reads at 256 KB and quota responses at 1 MB.
- The app does not follow redirects for quota HTTP requests.
- The app does not redeem reset credits or change account settings.

## Release Notes For Maintainers

Before publishing a release, verify:

- Source archives do not include local installers, build outputs, `.codex`, QA screenshots, or environment files.
- The Ubuntu 26.04 `.deb` is built by CI or a clean Ubuntu 26.04 machine.
- The package dependency metadata includes only supported Ubuntu runtime libraries.
- Release attachments include a SHA-256 checksum and are scanned for local paths and sensitive files.
