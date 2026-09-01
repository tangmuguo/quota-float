# Privacy

Quota Float is designed to be local-first and minimal.

## What the app reads

- The desktop app reads the local Codex login file from `CODEX_HOME/auth.json` or the user's `.codex/auth.json`.
- It sends the existing Codex access token only to the ChatGPT quota endpoints needed to read Codex usage.
- It may read the account identifier from the login file or token payload only to set the request header expected by the quota service.

## GNOME Shell extension boundary

The Ubuntu `.deb` includes a local GNOME Shell extension because ordinary Wayland clients cannot position one application window relative to another.

While Quota Float is running, the extension checks GNOME's normal top-level window list every 250 ms. It reads application identity, focus/minimized/workspace state, and frame geometry so it can identify the Quota Float and ChatGPT windows. Finding those windows necessarily examines this limited metadata for other top-level windows; it does not read any window contents, titles, keyboard input, prompts, chats, or files, and it makes no network requests.

The extension moves, raises, minimizes/restores, and changes the workspace of the Quota Float window only. It never moves, minimizes, raises, or changes the workspace of ChatGPT or another application.

In a GNOME session, the app makes a best-effort attempt to enable the installed extension at startup and disable it on a normal exit. A crash, forced termination, or system policy can prevent cleanup, so users can also control it explicitly:

```bash
gnome-extensions disable quota-float-anchor@quotafloat.app
gnome-extensions enable quota-float-anchor@quotafloat.app
```

Removing the Ubuntu package removes the extension files:

```bash
sudo apt remove quota-float-ubuntu
```

GNOME may require logging out and back in after an extension install, update, or removal.

## What it stores

Quota Float stores only widget preferences in its own application config directory:

- panel visibility and expanded/collapsed state;
- always-on-top preference;
- pinned provider and auto-rotate interval;
- interface language.

Older preference files may contain the retired `locked` field. Current versions ignore it and omit it the next time preferences are saved.

If the user enables Start at login, the autostart plugin creates the platform's standard login-start registration, such as an XDG autostart entry on Linux. Disabling the option removes that registration.

It does not copy or persist Codex tokens, account IDs, raw quota responses, user prompts, chat history, or local auth paths.

## What it sends

The app only calls these quota-related HTTPS endpoints from the local desktop process:

- `https://chatgpt.com/backend-api/wham/usage`
- `https://chatgpt.com/backend-api/wham/rate-limit-reset-credits`

No telemetry, analytics, crash reporting, or third-party tracking is included.

## Logging and accuracy

Logs are intentionally generic and must not include tokens, account IDs, raw backend responses, request headers, local auth paths, or personal file paths. Quota Float displays quota windows returned by the Codex quota service; it does not estimate quota from local token usage or fabricate values when the response shape is unknown.
