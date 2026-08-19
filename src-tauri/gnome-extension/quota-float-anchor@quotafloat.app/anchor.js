export const BOTTOM_RIGHT_MARGIN = 24;

/**
 * Returns a move-only target for a widget frame inside a host frame. The
 * widget's dimensions are deliberately not returned: the Tauri process owns
 * sizing, while GNOME Shell owns only placement.
 */
export function targetFrame(hostFrame, widgetFrame, margin = BOTTOM_RIGHT_MARGIN) {
    return {
        x: Math.max(
            hostFrame.x,
            hostFrame.x + hostFrame.width - widgetFrame.width - margin,
        ),
        y: Math.max(
            hostFrame.y,
            hostFrame.y + hostFrame.height - widgetFrame.height - margin,
        ),
    };
}

export function needsMove(currentFrame, target) {
    return currentFrame.x !== target.x || currentFrame.y !== target.y;
}
