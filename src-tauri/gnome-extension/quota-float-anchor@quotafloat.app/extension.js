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

// Window discovery/recovery only. Dragging follows geometry signals per frame.
const DISCOVERY_INTERVAL_MS = 250;

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
        this._enabled = true;
        this._lastHost = null;
        this._raisedWidget = null;
        this._host = null;
        this._widget = null;
        this._windowSignals = [];
        this._globalSignals = [];
        this._laterId = 0;
        this._fullSyncPending = false;
        this._laters = global.compositor.get_laters();

        this._connect(global.display, 'notify::focus-window',
            () => this._queueUpdate(true), this._globalSignals);
        this._connect(global.display, 'window-created',
            () => this._queueUpdate(true), this._globalSignals);
        this._connect(global.workspace_manager, 'active-workspace-changed',
            () => this._queueUpdate(true), this._globalSignals);
        this._sync();
        this._syncId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            DISCOVERY_INTERVAL_MS,
            () => {
                this._sync();
                return GLib.SOURCE_CONTINUE;
            },
        );
    }

    disable() {
        this._enabled = false;
        if (this._syncId) {
            GLib.source_remove(this._syncId);
            this._syncId = 0;
        }
        this._cancelUpdate();
        this._disconnect(this._windowSignals);
        this._disconnect(this._globalSignals);
        this._host = null;
        this._widget = null;
        if (this._raisedWidget?.is_above())
            this._raisedWidget.unmake_above();
        this._raisedWidget = null;
        this._lastHost = null;
        this._laters = null;
    }

    _connect(object, signal, callback, connections) {
        connections.push([object, object.connect(signal, callback)]);
    }

    _disconnect(connections) {
        for (const [object, id] of connections)
            object.disconnect(id);
        connections.length = 0;
    }

    _cancelUpdate() {
        if (this._laterId) {
            this._laters.remove(this._laterId);
            this._laterId = 0;
        }
        this._fullSyncPending = false;
    }

    _queueUpdate(fullSync = false) {
        if (!this._enabled)
            return;
        this._fullSyncPending ||= fullSync;
        if (this._laterId)
            return;

        const host = this._host;
        const widget = this._widget;
        this._laterId = this._laters.add(Meta.LaterType.BEFORE_REDRAW, () => {
            this._laterId = 0;
            const needsSync = this._fullSyncPending;
            this._fullSyncPending = false;
            if (this._enabled) {
                if (needsSync)
                    this._sync();
                else if (host === this._host && widget === this._widget)
                    this._positionWidget();
            }
            return GLib.SOURCE_REMOVE;
        });
    }

    _trackWindows(host, widget) {
        if (host === this._host && widget === this._widget)
            return;

        this._cancelUpdate();
        this._disconnect(this._windowSignals);
        this._host = host;
        this._widget = widget;

        for (const window of [host, widget].filter(Boolean)) {
            this._connect(window, 'size-changed',
                () => this._queueUpdate(), this._windowSignals);
            this._connect(window, 'notify::minimized',
                () => this._queueUpdate(true), this._windowSignals);
            this._connect(window, 'workspace-changed',
                () => this._queueUpdate(true), this._windowSignals);
            this._connect(window, 'unmanaged', () => {
                if (window === this._lastHost)
                    this._lastHost = null;
                if (window === this._raisedWidget)
                    this._raisedWidget = null;
                this._trackWindows(null, null);
                this._queueUpdate(true);
            }, this._windowSignals);
        }
        if (host) {
            for (const signal of ['position-changed', 'notify::fullscreen',
                'notify::maximized-horizontally', 'notify::maximized-vertically']) {
                this._connect(host, signal,
                    () => this._queueUpdate(), this._windowSignals);
            }
        }
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
        if (!this._enabled)
            return;
        this._fullSyncPending = false;
        const windows = this._windows();
        const widget = windows.find(isQuotaFloat);
        if (!widget) {
            this._trackWindows(null, null);
            this._lastHost = null;
            this._raisedWidget = null;
            return;
        }

        const host = this._selectHost(windows, widget);
        this._trackWindows(host, widget);
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

        this._positionWidget();
        widget.raise();
    }

    _positionWidget() {
        const host = this._host;
        const widget = this._widget;
        if (!host || !widget)
            return;
        const focused = global.display.get_focus_window();
        const workspace = global.workspace_manager.get_active_workspace();
        if ((focused !== host && focused !== widget) || widget.minimized ||
            !isVisibleOnActiveWorkspace(host, workspace)) {
            this._queueUpdate(true);
            return;
        }

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
    }
}
