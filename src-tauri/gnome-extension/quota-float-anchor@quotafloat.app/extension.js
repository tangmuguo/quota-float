import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {
    BOTTOM_RIGHT_MARGIN,
    isChatGptIdentity,
    isQuotaFloatIdentity,
    needsMove,
    selectHostCandidate,
    targetFrame,
} from './anchor.js';

const SYNC_INTERVAL_MS = 250;

function identitiesFor(window) {
    return [
        window.get_wm_class(),
        window.get_wm_class_instance(),
        window.get_gtk_application_id(),
        window.get_sandboxed_app_id(),
    ];
}

function isQuotaFloat(window) {
    return isQuotaFloatIdentity(identitiesFor(window));
}

function isChatGpt(window) {
    return isChatGptIdentity(identitiesFor(window));
}

function isVisibleOnActiveWorkspace(window, workspace) {
    return !window.minimized &&
        (window.is_on_all_workspaces() || window.get_workspace() === workspace) &&
        window.showing_on_its_workspace();
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
        return selectHostCandidate(hosts, focused, widget, this._lastHost);
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

        // A monitor's display scale is not necessarily its geometry scale:
        // fractional scaling can already be handled by the compositor stage.
        const logicalWidgetRect = widget.stage_to_protocol_rect(widgetRect);
        if (logicalWidgetRect.width <= 0 || logicalWidgetRect.height <= 0)
            return;

        const target = targetFrame(hostRect, widgetRect, BOTTOM_RIGHT_MARGIN, {
            fullscreen: host.fullscreen,
            maximizedHorizontally: host.maximized_horizontally,
            maximizedVertically: host.maximized_vertically,
            widgetGeometryScale: widgetRect.width / logicalWidgetRect.width,
        });
        if (needsMove(widgetRect, target))
            widget.move_frame(false, target.x, target.y);
        widget.raise();
    }
}
