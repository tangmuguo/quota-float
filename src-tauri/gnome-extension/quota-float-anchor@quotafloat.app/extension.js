import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {needsMove, targetFrame} from './anchor.js';

const SYNC_INTERVAL_MS = 120;

function identityFor(window) {
    return [
        window.get_wm_class(),
        window.get_wm_class_instance(),
        window.get_gtk_application_id(),
        window.get_sandboxed_app_id(),
    ].filter(value => value).join(' ').toLowerCase();
}

function isQuotaFloat(window) {
    const identity = identityFor(window);
    return identity.includes('app.quotafloat.desktop') ||
        identity.includes('quota-float') ||
        identity.includes('quotafloat');
}

function isChatGpt(window) {
    const identity = identityFor(window);
    if (identity.includes('chatgpt') || identity.includes('openai'))
        return true;

    // The current Linux desktop client is launched as `chatgpt`, while some
    // builds expose only `codex` in their GTK application identifier.
    return identity === 'codex' || identity.endsWith('.codex');
}

function isVisibleOnActiveWorkspace(window, workspace) {
    return !window.minimized &&
        (window.is_on_all_workspaces() || window.get_workspace() === workspace) &&
        window.showing_on_its_workspace();
}

function largestWindow(windows) {
    return windows.reduce((largest, candidate) => {
        const largestRect = largest.get_frame_rect();
        const candidateRect = candidate.get_frame_rect();
        return candidateRect.width * candidateRect.height > largestRect.width * largestRect.height
            ? candidate
            : largest;
    });
}

export default class QuotaFloatChatGptAnchor extends Extension {
    enable() {
        this._lastHost = null;
        this._raisedWidget = null;
        this._sync();
        this._syncId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            SYNC_INTERVAL_MS,
            () => {
                this._sync();
                return GLib.SOURCE_CONTINUE;
            },
        );
    }

    disable() {
        if (this._syncId) {
            GLib.source_remove(this._syncId);
            this._syncId = 0;
        }
        if (this._raisedWidget?.is_above())
            this._raisedWidget.unmake_above();
        this._raisedWidget = null;
        this._lastHost = null;
    }

    _windows() {
        return global.display.get_tab_list(Meta.TabList.NORMAL_ALL, null);
    }

    _selectHost(windows, widget) {
        const workspace = global.workspace_manager.get_active_workspace();
        const hosts = windows.filter(window =>
            isChatGpt(window) && isVisibleOnActiveWorkspace(window, workspace));
        if (hosts.length === 0)
            return null;

        const focused = global.display.get_focus_window();
        // Match the Windows host lookup, which selects the largest visible
        // ChatGPT top-level window rather than a small modal or dialog.
        if (hosts.includes(focused))
            return largestWindow(hosts);

        // Interaction with the widget itself moves focus away from ChatGPT;
        // retain its last active host during that interaction.
        if (focused === widget && hosts.includes(this._lastHost))
            return this._lastHost;

        // Starting Quota Float gives its own window focus. Choose the same
        // largest host window as the Windows implementation in that case.
        return focused === widget ? largestWindow(hosts) : null;
    }

    _sync() {
        const windows = this._windows();
        const widget = windows.find(isQuotaFloat);
        if (!widget)
            return;

        const host = this._selectHost(windows, widget);
        if (!host) {
            this._lastHost = null;
            if (!widget.minimized)
                widget.minimize();
            return;
        }

        this._lastHost = host;
        if (widget.minimized)
            widget.unminimize();

        const hostWorkspace = host.get_workspace();
        if (!widget.is_on_all_workspaces() && hostWorkspace &&
            widget.get_workspace() !== hostWorkspace)
            widget.change_workspace(hostWorkspace);

        if (!widget.is_above())
            widget.make_above();
        this._raisedWidget = widget;

        const hostRect = host.get_frame_rect();
        const widgetRect = widget.get_frame_rect();
        if (widgetRect.width <= 0 || widgetRect.height <= 0)
            return;

        const target = targetFrame(hostRect, widgetRect);
        if (needsMove(widgetRect, target))
            widget.move_frame(false, target.x, target.y);
        widget.raise();
    }
}
