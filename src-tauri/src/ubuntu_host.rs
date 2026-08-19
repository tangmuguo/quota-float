//! Ubuntu 26.04 window placement for the quota widget.
//!
//! GNOME on Wayland deliberately leaves final top-level-window placement to
//! the compositor. We still request the bottom-right work-area position, which
//! is exact under Ubuntu on Xorg and a harmless best effort under Wayland. The
//! UI exposes a native drag region for the latter case and remembers the
//! position when the compositor reports one.

use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};

use crate::models::WidgetPosition;

const RIGHT_MARGIN: i32 = 24;
const BOTTOM_MARGIN: i32 = 24;
const EXPANDED_WIDGET_SIZE: f64 = 320.0;
const COLLAPSED_WIDGET_SIZE: f64 = 100.0;

#[derive(Clone, Copy, Debug, PartialEq)]
struct Workspace {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    scale_factor: f64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct WidgetLayout {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

fn logical_size(expanded: bool) -> f64 {
    if expanded {
        EXPANDED_WIDGET_SIZE
    } else {
        COLLAPSED_WIDGET_SIZE
    }
}

fn physical_pixels(logical: f64, scale_factor: f64) -> u32 {
    (logical * scale_factor).round().max(1.0) as u32
}

fn clamp_axis(value: i32, origin: i32, span: u32, size: u32) -> i32 {
    let end = origin.saturating_add(span.min(i32::MAX as u32) as i32);
    let maximum = end.saturating_sub(size.min(i32::MAX as u32) as i32);
    value.clamp(origin, maximum.max(origin))
}

fn target_layout(
    workspace: Workspace,
    expanded: bool,
    remembered_position: Option<WidgetPosition>,
) -> WidgetLayout {
    let width = physical_pixels(logical_size(expanded), workspace.scale_factor);
    let height = width;
    let right_margin = physical_pixels(f64::from(RIGHT_MARGIN), workspace.scale_factor) as i32;
    let bottom_margin = physical_pixels(f64::from(BOTTOM_MARGIN), workspace.scale_factor) as i32;
    let default_x = workspace
        .x
        .saturating_add(workspace.width.min(i32::MAX as u32) as i32)
        .saturating_sub(width.min(i32::MAX as u32) as i32)
        .saturating_sub(right_margin);
    let default_y = workspace
        .y
        .saturating_add(workspace.height.min(i32::MAX as u32) as i32)
        .saturating_sub(height.min(i32::MAX as u32) as i32)
        .saturating_sub(bottom_margin);
    let (x, y) = remembered_position
        .map(|position| (position.x, position.y))
        .unwrap_or((default_x, default_y));
    WidgetLayout {
        x: clamp_axis(x, workspace.x, workspace.width, width),
        y: clamp_axis(y, workspace.y, workspace.height, height),
        width,
        height,
    }
}

pub fn apply_expanded(
    app: &AppHandle,
    expanded: bool,
    remembered_position: Option<WidgetPosition>,
) -> Result<(), String> {
    let window = app
        .get_webview_window("widget")
        .ok_or_else(|| "widget window missing".to_string())?;
    let monitor = remembered_position
        .as_ref()
        .and_then(|position| {
            window
                .monitor_from_point(f64::from(position.x), f64::from(position.y))
                .ok()
                .flatten()
        })
        .or_else(|| window.current_monitor().ok().flatten())
        .or_else(|| window.primary_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let work_area = monitor.work_area();
        let layout = target_layout(
            Workspace {
                x: work_area.position.x,
                y: work_area.position.y,
                width: work_area.size.width,
                height: work_area.size.height,
                scale_factor: monitor.scale_factor(),
            },
            expanded,
            remembered_position,
        );
        window
            .set_size(PhysicalSize::new(layout.width, layout.height))
            .map_err(|_| "failed to resize widget".to_string())?;
        // Wayland compositors may decline client-selected positions. Keep the
        // correctly sized, interactive widget available when that happens.
        if let Err(error) = window.set_position(PhysicalPosition::new(layout.x, layout.y)) {
            eprintln!("bottom-right placement was declined by the compositor: {error}");
        }
        return Ok(());
    }

    let size = logical_size(expanded);
    window
        .set_size(tauri::LogicalSize::new(size, size))
        .map_err(|_| "failed to resize widget".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn anchors_expanded_and_compact_layouts_to_the_workspace_bottom_right() {
        let workspace = Workspace {
            x: 0,
            y: 36,
            width: 1600,
            height: 864,
            scale_factor: 1.0,
        };
        assert_eq!(
            target_layout(workspace, true, None),
            WidgetLayout {
                x: 1256,
                y: 556,
                width: 320,
                height: 320,
            }
        );
        assert_eq!(
            target_layout(workspace, false, None),
            WidgetLayout {
                x: 1476,
                y: 776,
                width: 100,
                height: 100,
            }
        );
    }

    #[test]
    fn scales_geometry_and_keeps_a_remembered_position_visible() {
        let workspace = Workspace {
            x: -1920,
            y: 0,
            width: 1920,
            height: 1080,
            scale_factor: 1.5,
        };
        assert_eq!(
            target_layout(workspace, false, None),
            WidgetLayout {
                x: -186,
                y: 894,
                width: 150,
                height: 150,
            }
        );
        assert_eq!(
            target_layout(workspace, true, Some(WidgetPosition { x: 100, y: -500 }),),
            WidgetLayout {
                x: -480,
                y: 0,
                width: 480,
                height: 480,
            }
        );
    }
}
