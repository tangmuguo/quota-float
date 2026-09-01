# Security

## Supported Use

Quota Float is a local desktop utility that reads Codex quota using the user's existing local Codex login state.

## Reporting Issues

Please do not open public issues containing tokens, account IDs, raw backend responses, screenshots with personal data, or local file paths. Redact sensitive information before sharing logs or bug reports.

## Security Boundaries

- The app does not persist Codex credentials.
- The app does not log request headers or raw quota responses.
- The app caps each auth file read at 256 KB and each quota response at 1 MB.
- The app does not follow redirects for quota HTTP requests.
- The app does not redeem reset credits or change account settings.

## Release Notes For Maintainers

Before publishing a release, verify:

- Source archives do not include local installers, build outputs, `.codex`, QA screenshots, or environment files.
- Windows, macOS, and Ubuntu bundles are built by their matching CI runners or clean matching hosts.
- The Ubuntu package dependency metadata includes only supported Ubuntu runtime libraries.
- The Ubuntu `.deb` is extracted and its installed file tree is scanned for forbidden files, local paths, and high-confidence secrets.
- Every release attachment is covered by `SHA256SUMS.txt`.
