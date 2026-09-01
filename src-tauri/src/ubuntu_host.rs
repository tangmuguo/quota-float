//! GNOME integration for the Ubuntu quota widget.
//!
//! Wayland clients cannot make themselves children of, or choose a position
//! inside, another application's window. The packaged GNOME Shell extension
//! has compositor authority, so it anchors this regular Tauri window to the
//! active ChatGPT window instead. Keeping positioning out of the client also
//! avoids the GTK/Wayland configure loop caused by resizing and repositioning
//! the same surface in one IPC transaction.

use std::{env, process::Command, thread};

use tauri::{AppHandle, Manager};

pub const SHELL_EXTENSION_UUID: &str = "quota-float-anchor@quotafloat.app";

const EXPANDED_WIDGET_SIZE: f64 = 320.0;
const COLLAPSED_WIDGET_SIZE: f64 = 100.0;

fn logical_size(expanded: bool) -> f64 {
    if expanded {
        EXPANDED_WIDGET_SIZE
    } else {
        COLLAPSED_WIDGET_SIZE
    }
}

/// Applies only the size change. The GNOME Shell extension observes the
/// resulting frame dimensions and moves the widget on its next compositor
/// tick, so this call never combines a resize with a client-requested move.
pub fn apply_expanded(app: &AppHandle, expanded: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("widget")
        .ok_or_else(|| "widget window missing".to_string())?;
    let size = logical_size(expanded);
    let exact_size = tauri::LogicalSize::new(size, size);
    // GTK/Wayland must keep the surface technically resizable so programmatic
    // mode changes are honored. Pinning min/max to the selected mode prevents
    // users from dragging the undecorated window to an in-between size.
    if expanded {
        window
            .set_max_size(Some(exact_size))
            .map_err(|_| "failed to update maximum widget size".to_string())?;
        window
            .set_min_size(Some(exact_size))
            .map_err(|_| "failed to update minimum widget size".to_string())?;
    } else {
        window
            .set_min_size(Some(exact_size))
            .map_err(|_| "failed to update minimum widget size".to_string())?;
        window
            .set_max_size(Some(exact_size))
            .map_err(|_| "failed to update maximum widget size".to_string())?;
    }
    window
        .set_size(exact_size)
        .map_err(|_| "failed to resize widget".to_string())
}

fn is_gnome_desktop(value: Option<&str>) -> bool {
    value
        .map(|desktop| {
            desktop
                .split(':')
                .any(|entry| entry.eq_ignore_ascii_case("gnome"))
        })
        .unwrap_or(false)
}

/// Enables the system-installed extension for the current desktop session.
/// This is intentionally best-effort and runs off the Tauri event loop: an
/// unavailable extension must never delay the widget or a panel resize.
pub fn start(_app: AppHandle) {
    if !is_gnome_desktop(env::var("XDG_CURRENT_DESKTOP").ok().as_deref()) {
        return;
    }

    thread::spawn(|| {
        let result = Command::new("gnome-extensions")
            .args(["enable", SHELL_EXTENSION_UUID])
            .output();
        match result {
            Ok(output) if output.status.success() => {}
            Ok(output) => eprintln!(
                "GNOME Shell anchor extension could not be enabled (status {}); \
                 after installing or updating Quota Float, log out and back in once, then enable {}",
                output.status, SHELL_EXTENSION_UUID
            ),
            Err(error) => eprintln!(
                "GNOME Shell anchor extension is unavailable: {error}; \
                 install the Quota Float Ubuntu package and enable {} manually",
                SHELL_EXTENSION_UUID
            ),
        }
    });
}

/// Stops the session extension when the application exits. It is enabled again
/// on the next launch, so the compositor helper does not keep inspecting window
/// metadata while Quota Float is not running.
pub fn stop() {
    if !is_gnome_desktop(env::var("XDG_CURRENT_DESKTOP").ok().as_deref()) {
        return;
    }

    match Command::new("gnome-extensions")
        .args(["disable", SHELL_EXTENSION_UUID])
        .output()
    {
        Ok(output) if output.status.success() => {}
        Ok(output) => eprintln!(
            "GNOME Shell anchor extension could not be disabled (status {})",
            output.status
        ),
        Err(error) => eprintln!("GNOME Shell anchor extension could not be disabled: {error}"),
    }
}

#[cfg(test)]
mod tests {
    use super::{is_gnome_desktop, logical_size, COLLAPSED_WIDGET_SIZE, EXPANDED_WIDGET_SIZE};

    #[test]
    fn uses_the_same_logical_sizes_as_the_frontend_breakpoint() {
        assert_eq!(logical_size(true), EXPANDED_WIDGET_SIZE);
        assert_eq!(logical_size(false), COLLAPSED_WIDGET_SIZE);
    }

    #[test]
    fn recognizes_ubuntu_gnome_desktop_identifiers() {
        assert!(is_gnome_desktop(Some("ubuntu:GNOME")));
        assert!(is_gnome_desktop(Some("GNOME")));
        assert!(!is_gnome_desktop(Some("KDE")));
        assert!(!is_gnome_desktop(None));
    }

    #[test]
    fn linux_override_allows_programmatic_resizing_without_changing_other_platforms() {
        let base: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.conf.json")).expect("valid base config");
        let linux: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.linux.conf.json"))
                .expect("valid Linux config");

        assert_eq!(
            base["app"]["windows"][0]["resizable"].as_bool(),
            Some(false)
        );
        assert_eq!(
            linux["app"]["windows"][0]["resizable"].as_bool(),
            Some(true)
        );
    }
}
