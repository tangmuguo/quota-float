mod codex;
mod models;
mod ubuntu_host;

use std::{
    fs,
    io::Write,
    path::PathBuf,
    sync::Mutex,
    time::{Duration, Instant},
};

use models::{ProviderSnapshot, WidgetPreferences};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Listener, Manager, Runtime, State, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

pub(crate) struct AppState {
    client: reqwest::Client,
    pub(crate) preferences: Mutex<WidgetPreferences>,
    pub(crate) layout_lock: Mutex<()>,
    preferences_path: PathBuf,
    fetch_lock: tokio::sync::Mutex<()>,
    snapshot_cache: Mutex<Option<(Instant, Vec<ProviderSnapshot>)>>,
}

const TRAY_LANGUAGE_CHANGED_EVENT: &str = "tray-language-changed";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TrayLabels {
    show_panel: &'static str,
    refresh: &'static str,
    unlock: &'static str,
    language: &'static str,
    autostart: &'static str,
    quit: &'static str,
}

struct TrayMenuItems<R: Runtime> {
    show_panel: CheckMenuItem<R>,
    refresh: MenuItem<R>,
    unlock: MenuItem<R>,
    language: MenuItem<R>,
    autostart: CheckMenuItem<R>,
    quit: MenuItem<R>,
}

fn tray_labels(language: &str) -> TrayLabels {
    if language == "en" {
        TrayLabels {
            show_panel: "Show quota panel",
            refresh: "Refresh now",
            unlock: "Unlock widget",
            language: "Switch to Chinese",
            autostart: "Start at login",
            quit: "Quit",
        }
    } else {
        TrayLabels {
            show_panel: "显示额度面板",
            refresh: "立即刷新",
            unlock: "解锁悬浮窗",
            language: "切换到英文",
            autostart: "开机启动",
            quit: "退出",
        }
    }
}

fn apply_tray_labels<R: Runtime>(
    labels: TrayLabels,
    items: &TrayMenuItems<R>,
) -> tauri::Result<()> {
    items.show_panel.set_text(labels.show_panel)?;
    items.refresh.set_text(labels.refresh)?;
    items.unlock.set_text(labels.unlock)?;
    items.language.set_text(labels.language)?;
    items.autostart.set_text(labels.autostart)?;
    items.quit.set_text(labels.quit)?;
    Ok(())
}

async fn fetch_snapshots_uncached(state: &State<'_, AppState>) -> Vec<ProviderSnapshot> {
    let _guard = state.fetch_lock.lock().await;
    let values = vec![codex::fetch_snapshot(&state.client).await];
    if let Ok(mut cache) = state.snapshot_cache.lock() {
        *cache = Some((Instant::now(), values.clone()));
    }
    values
}

fn load_preferences(path: &PathBuf) -> WidgetPreferences {
    let parse = |candidate: &PathBuf| {
        fs::read_to_string(candidate)
            .ok()
            .and_then(|raw| serde_json::from_str::<WidgetPreferences>(&raw).ok())
    };
    if let Some(value) = parse(path) {
        return value.normalized();
    }
    let backup = path.with_extension("json.bak");
    if let Some(value) = parse(&backup) {
        eprintln!("preferences recovered from backup");
        return value.normalized();
    }
    WidgetPreferences::default()
}

fn persist_preferences(path: &PathBuf, value: &WidgetPreferences) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|_| "failed to create settings directory".to_string())?;
    }
    let serialized =
        serde_json::to_vec_pretty(value).map_err(|_| "failed to serialize settings".to_string())?;
    let temporary = path.with_extension("json.tmp");
    let backup = path.with_extension("json.bak");
    let mut file = fs::File::create(&temporary)
        .map_err(|_| "failed to create temporary settings file".to_string())?;
    file.write_all(&serialized)
        .and_then(|_| file.sync_all())
        .map_err(|_| "failed to write settings".to_string())?;
    if path.exists() {
        let _ = fs::remove_file(&backup);
        fs::rename(path, &backup).map_err(|_| "failed to back up settings".to_string())?;
    }
    if let Err(error) = fs::rename(&temporary, path) {
        let _ = fs::rename(&backup, path);
        return Err(format!("failed to commit settings: {error}"));
    }
    Ok(())
}

#[tauri::command]
async fn get_snapshots(state: State<'_, AppState>) -> Result<Vec<ProviderSnapshot>, String> {
    const CACHE_TTL: Duration = Duration::from_secs(30);
    if let Ok(cache) = state.snapshot_cache.lock() {
        if let Some((time, values)) = &*cache {
            if time.elapsed() < CACHE_TTL {
                return Ok(values.clone());
            }
        }
    }
    let _guard = match state.fetch_lock.try_lock() {
        Ok(guard) => guard,
        Err(_) => {
            if let Ok(cache) = state.snapshot_cache.lock() {
                if let Some((_, values)) = &*cache {
                    return Ok(values.clone());
                }
            }
            return Ok(vec![ProviderSnapshot::failure(
                "unavailable",
                "Quota refresh is already running.",
            )]);
        }
    };
    if let Ok(cache) = state.snapshot_cache.lock() {
        if let Some((time, values)) = &*cache {
            if time.elapsed() < CACHE_TTL {
                return Ok(values.clone());
            }
        }
    }
    let values = vec![codex::fetch_snapshot(&state.client).await];
    if let Ok(mut cache) = state.snapshot_cache.lock() {
        *cache = Some((Instant::now(), values.clone()));
    }
    Ok(values)
}

#[tauri::command]
async fn refresh_snapshots(state: State<'_, AppState>) -> Result<Vec<ProviderSnapshot>, String> {
    Ok(fetch_snapshots_uncached(&state).await)
}

#[tauri::command]
fn get_preferences(state: State<'_, AppState>) -> Result<WidgetPreferences, String> {
    state
        .preferences
        .lock()
        .map(|value| value.clone())
        .map_err(|_| "settings unavailable".into())
}

#[tauri::command]
fn set_preferences(
    preferences: WidgetPreferences,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut current = state
        .preferences
        .lock()
        .map_err(|_| "settings unavailable".to_string())?;
    let mut preferences = preferences.normalized();
    // Expanded/collapsed mode is a native window transaction. Generic settings
    // saves must not overwrite a concurrent native toggle.
    preferences.expanded = current.expanded;
    let language_changed = preferences.language != current.language;
    persist_preferences(&state.preferences_path, &preferences)?;
    *current = preferences.clone();
    drop(current);
    if language_changed {
        let _ = app.emit(TRAY_LANGUAGE_CHANGED_EVENT, preferences.language);
    }
    Ok(())
}

#[tauri::command]
fn set_widget_expanded(
    expanded: bool,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<WidgetPreferences, String> {
    let _layout_guard = state
        .layout_lock
        .lock()
        .map_err(|_| "window layout unavailable".to_string())?;
    // Do not keep the preferences mutex while sending GTK a size request.
    // On Wayland, configure notifications can re-enter application code; the
    // previous implementation held this lock across resize + move and could
    // leave the one-shot resize command waiting indefinitely.
    let previous = state
        .preferences
        .lock()
        .map_err(|_| "settings unavailable".to_string())?
        .clone();
    if previous.expanded == expanded {
        ubuntu_host::apply_expanded(&app, expanded)?;
        return Ok(previous);
    }

    ubuntu_host::apply_expanded(&app, expanded)?;
    let mut preferences = state
        .preferences
        .lock()
        .map_err(|_| "settings unavailable".to_string())?;
    let mut next = preferences.clone();
    next.expanded = expanded;
    if persist_preferences(&state.preferences_path, &next).is_err() {
        return match ubuntu_host::apply_expanded(&app, previous.expanded) {
            Ok(()) => Err("failed to save panel size; previous layout restored".to_string()),
            Err(_) => Err(
                "failed to save panel size and restore the previous layout; reopen the widget"
                    .to_string(),
            ),
        };
    }

    *preferences = next.clone();
    drop(preferences);
    let _ = app.emit_to("widget", "preferences-changed", next.clone());
    Ok(next)
}

fn apply_panel_visibility(app: &AppHandle, visible: bool) {
    if let Some(window) = app.get_webview_window("widget") {
        if visible {
            let _ = window.show();
        } else {
            let _ = window.hide();
        }
    }
}

fn update_panel_visibility(app: &AppHandle, visible: bool) -> Result<WidgetPreferences, String> {
    let state = app
        .try_state::<AppState>()
        .ok_or_else(|| "settings unavailable".to_string())?;
    let mut preferences = state
        .preferences
        .lock()
        .map_err(|_| "settings unavailable".to_string())?;
    let previous = preferences.clone();
    let mut next = previous.clone();
    next.panel_visible = visible;
    persist_preferences(&state.preferences_path, &next)?;
    *preferences = next.clone();
    drop(preferences);
    apply_panel_visibility(app, visible);
    let _ = app.emit_to("widget", "preferences-changed", next.clone());
    Ok(next)
}

#[tauri::command]
fn set_panel_visible(visible: bool, app: AppHandle) -> Result<WidgetPreferences, String> {
    update_panel_visibility(&app, visible)
}

fn apply_lock(app: &AppHandle, locked: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("widget")
        .ok_or_else(|| "widget window missing".to_string())?;
    window
        .set_ignore_cursor_events(locked)
        .map_err(|_| "failed to toggle click-through".to_string())
}

#[tauri::command]
fn set_widget_locked(
    locked: bool,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<WidgetPreferences, String> {
    let previous = state
        .preferences
        .lock()
        .map_err(|_| "settings unavailable".to_string())?
        .clone();
    let mut next = previous.clone();
    next.locked = locked;
    persist_preferences(&state.preferences_path, &next)?;
    if let Err(error) = apply_lock(&app, locked) {
        let _ = persist_preferences(&state.preferences_path, &previous);
        return Err(error);
    }
    *state
        .preferences
        .lock()
        .map_err(|_| "settings unavailable".to_string())? = next.clone();
    Ok(next)
}

fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let (panel_visible, initial_language) = app
        .state::<AppState>()
        .preferences
        .lock()
        .map(|prefs| (prefs.panel_visible, prefs.language.clone()))
        .unwrap_or_else(|_| (true, "zh-CN".into()));
    let labels = tray_labels(&initial_language);
    let show_panel = CheckMenuItem::with_id(
        app,
        "show_panel",
        labels.show_panel,
        true,
        panel_visible,
        None::<&str>,
    )?;
    let refresh = MenuItem::with_id(app, "refresh", labels.refresh, true, None::<&str>)?;
    let unlock = MenuItem::with_id(app, "unlock", labels.unlock, true, None::<&str>)?;
    let language = MenuItem::with_id(app, "language", labels.language, true, None::<&str>)?;
    let autostart_enabled = app.autolaunch().is_enabled().unwrap_or(false);
    let autostart = CheckMenuItem::with_id(
        app,
        "autostart",
        labels.autostart,
        true,
        autostart_enabled,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, "quit", labels.quit, true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[&show_panel, &refresh, &unlock, &language, &autostart, &quit],
    )?;
    let mut builder = TrayIconBuilder::with_id("main")
        .menu(&menu)
        .tooltip("Quota Float · Ubuntu 26.04");
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    let autostart_menu = autostart.clone();
    let show_panel_menu = show_panel.clone();
    let show_panel_click_menu = show_panel.clone();
    let label_items = TrayMenuItems {
        show_panel: show_panel.clone(),
        refresh: refresh.clone(),
        unlock: unlock.clone(),
        language: language.clone(),
        autostart: autostart.clone(),
        quit: quit.clone(),
    };
    app.listen(TRAY_LANGUAGE_CHANGED_EVENT, move |event| {
        let Ok(language) = serde_json::from_str::<String>(event.payload()) else {
            return;
        };
        if apply_tray_labels(tray_labels(&language), &label_items).is_err() {
            eprintln!("tray language update failed");
        }
    });
    builder
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "show_panel" => {
                let visible = app
                    .try_state::<AppState>()
                    .and_then(|state| {
                        state
                            .preferences
                            .lock()
                            .ok()
                            .map(|prefs| !prefs.panel_visible)
                    })
                    .unwrap_or(true);
                match update_panel_visibility(app, visible) {
                    Ok(_) => {
                        let _ = show_panel_menu.set_checked(visible);
                    }
                    Err(_) => eprintln!("panel visibility update failed"),
                }
            }
            "refresh" => {
                let _ = app.emit_to("widget", "refresh-requested", ());
            }
            "unlock" => {
                let _ = apply_lock(app, false);
                if let Some(state) = app.try_state::<AppState>() {
                    if let Ok(mut prefs) = state.preferences.lock() {
                        prefs.locked = false;
                        let _ = persist_preferences(&state.preferences_path, &prefs);
                        let _ = app.emit_to("widget", "preferences-changed", prefs.clone());
                    }
                }
            }
            "language" => {
                if let Some(state) = app.try_state::<AppState>() {
                    let updated = state.preferences.lock().ok().and_then(|mut prefs| {
                        let mut next = prefs.clone();
                        next.language = if next.language == "en" {
                            "zh-CN".into()
                        } else {
                            "en".into()
                        };
                        let next = next.normalized();
                        persist_preferences(&state.preferences_path, &next).ok()?;
                        *prefs = next.clone();
                        Some(next)
                    });
                    if let Some(updated) = updated {
                        let _ = app.emit(TRAY_LANGUAGE_CHANGED_EVENT, updated.language.clone());
                        let _ = app.emit_to("widget", "preferences-changed", updated);
                    } else {
                        eprintln!("language update failed");
                    }
                }
            }
            "autostart" => {
                let manager = app.autolaunch();
                let enabled = manager.is_enabled().unwrap_or(false);
                let result = if enabled {
                    manager.disable()
                } else {
                    manager.enable()
                };
                match result {
                    Ok(()) => {
                        let _ = autostart_menu.set_checked(!enabled);
                    }
                    Err(_) => eprintln!("autostart update failed"),
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if update_panel_visibility(tray.app_handle(), true).is_ok() {
                    let _ = show_panel_click_menu.set_checked(true);
                }
            }
        })
        .build(app)?;
    Ok(())
}

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let _ = update_panel_visibility(app, true);
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            let data_dir = app.path().app_config_dir()?;
            let preferences_path = data_dir.join("preferences.json");
            let preferences = load_preferences(&preferences_path);
            let client = reqwest::Client::builder()
                .timeout(Duration::from_secs(12))
                .redirect(reqwest::redirect::Policy::none())
                .user_agent(concat!("QuotaFloat/", env!("CARGO_PKG_VERSION")))
                .build()
                .expect("static HTTP client configuration must be valid");
            app.manage(AppState {
                client,
                preferences: Mutex::new(preferences.clone()),
                layout_lock: Mutex::new(()),
                preferences_path,
                fetch_lock: tokio::sync::Mutex::new(()),
                snapshot_cache: Mutex::new(None),
            });
            if setup_tray(app).is_err() {
                eprintln!("tray setup failed");
            }
            if preferences.locked {
                let _ = apply_lock(app.handle(), true);
            }
            if let Some(window) = app.get_webview_window("widget") {
                // The Shell extension owns stacking and workspace affinity so
                // the widget stays with ChatGPT instead of becoming a desktop
                // overlay when another application is focused.
                let _ = window.set_skip_taskbar(true);
                let _ = window.set_always_on_top(false);
                let _ = window.set_visible_on_all_workspaces(false);
            }
            if ubuntu_host::apply_expanded(app.handle(), preferences.expanded).is_err() {
                eprintln!("initial widget layout failed");
            }
            apply_panel_visibility(app.handle(), preferences.panel_visible);
            ubuntu_host::start();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_snapshots,
            refresh_snapshots,
            get_preferences,
            set_preferences,
            set_widget_expanded,
            set_panel_visible,
            set_widget_locked
        ])
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("failed to build Quota Float");
    app.run(|app_handle, event| {
        if matches!(event, tauri::RunEvent::Resumed) {
            let _ = app_handle.emit_to("widget", "refresh-requested", ());
        }
    });
}

#[cfg(test)]
mod tray_label_tests {
    use super::{tray_labels, TrayLabels};

    #[test]
    fn returns_english_tray_labels() {
        assert_eq!(
            tray_labels("en"),
            TrayLabels {
                show_panel: "Show quota panel",
                refresh: "Refresh now",
                unlock: "Unlock widget",
                language: "Switch to Chinese",
                autostart: "Start at login",
                quit: "Quit",
            }
        );
    }

    #[test]
    fn returns_chinese_tray_labels_and_uses_them_as_the_fallback() {
        let expected = TrayLabels {
            show_panel: "显示额度面板",
            refresh: "立即刷新",
            unlock: "解锁悬浮窗",
            language: "切换到英文",
            autostart: "开机启动",
            quit: "退出",
        };
        assert_eq!(tray_labels("zh-CN"), expected);
        assert_eq!(tray_labels("unsupported"), expected);
    }
}
