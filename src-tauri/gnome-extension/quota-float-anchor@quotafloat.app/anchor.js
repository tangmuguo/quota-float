export const BOTTOM_RIGHT_MARGIN = 24;
export const COMPACT_BOTTOM_MARGIN = 160;

const COMPACT_WIDGET_SIZE = 100;

function normalizedIdentities(values) {
    return values
        .filter(value => typeof value === 'string' && value.trim().length > 0)
        .map(value => value.trim().toLowerCase());
}

export function isQuotaFloatIdentity(values) {
    return normalizedIdentities(values).some(identity =>
        identity.includes('app.quotafloat.desktop') ||
        identity.includes('quota-float') ||
        identity.includes('quotafloat'));
}

export function isChatGptIdentity(values) {
    return normalizedIdentities(values).some(identity =>
        identity.includes('chatgpt') ||
        identity.includes('openai') ||
        identity === 'codex' ||
        identity.endsWith('.codex'));
}

export function selectHostCandidate(hosts, focused, widget, lastHost) {
    if (hosts.includes(focused))
        return focused;
    if (focused === widget) {
        if (hosts.includes(lastHost))
            return lastHost;
        // Meta.TabList is ordered by most-recent use, so the first matching
        // host is the best fallback when launching the widget steals focus.
        return hosts[0] ?? null;
    }
    return null;
}

/**
 * Returns a move-only target for a widget frame inside a host frame. The
 * widget's dimensions are deliberately not returned: the Tauri process owns
 * sizing, while GNOME Shell owns only placement. Frames and the original
 * margin use stage coordinates; the extra compact lift uses logical pixels
 * converted with the widget's own geometry scale.
 */
export function targetFrame(hostFrame, widgetFrame, margin = BOTTOM_RIGHT_MARGIN, options = {}) {
    const geometryScale = options.widgetGeometryScale ?? 1;
    const compact = widgetFrame.width <= COMPACT_WIDGET_SIZE * geometryScale &&
        widgetFrame.height <= COMPACT_WIDGET_SIZE * geometryScale;
    const maximized = options.maximizedHorizontally && options.maximizedVertically;
    // Restored and tiled hosts put composer controls close to the right edge.
    // Reserve their bottom area without inspecting any application contents.
    // The expanded panel and fullscreen/fully maximized hosts retain their anchor.
    const bottomMargin = compact && !options.fullscreen && !maximized
        ? margin + Math.round((COMPACT_BOTTOM_MARGIN - BOTTOM_RIGHT_MARGIN) * geometryScale)
        : margin;

    return {
        x: Math.max(
            hostFrame.x,
            hostFrame.x + hostFrame.width - widgetFrame.width - margin,
        ),
        y: Math.max(
            hostFrame.y,
            hostFrame.y + hostFrame.height - widgetFrame.height - bottomMargin,
        ),
    };
}

export function needsMove(currentFrame, target) {
    return currentFrame.x !== target.x || currentFrame.y !== target.y;
}
