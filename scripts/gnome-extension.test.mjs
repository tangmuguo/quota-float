import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const extensionDirectory = new URL("../src-tauri/gnome-extension/quota-float-anchor@quotafloat.app/", import.meta.url);
const [extensionSource, anchorSource] = await Promise.all([
  readFile(new URL("extension.js", extensionDirectory), "utf8"),
  readFile(new URL("anchor.js", extensionDirectory), "utf8"),
]);

class Signals {
  connections = new Map();
  nextId = 1;

  connect(signal, callback) {
    const id = this.nextId++;
    this.connections.set(id, { signal, callback });
    return id;
  }

  disconnect(id) {
    assert.ok(this.connections.delete(id), "signal must be disconnected exactly once");
  }

  emit(signal) {
    for (const [id, connection] of [...this.connections]) {
      if (connection.signal === signal && this.connections.has(id)) connection.callback(this);
    }
  }
}

class Window extends Signals {
  minimized = false;
  above = false;
  fullscreen = false;
  maximized_horizontally = false;
  maximized_vertically = false;
  geometryScale = 1;
  moves = [];
  raises = 0;

  constructor(identity, frame, workspace) {
    super();
    this.identity = identity;
    this.frame = frame;
    this.workspace = workspace;
  }

  get_wm_class() { return this.identity; }
  get_wm_class_instance() { return this.identity; }
  get_gtk_application_id() { return this.identity; }
  get_sandboxed_app_id() { return null; }
  get_workspace() { return this.workspace; }
  is_on_all_workspaces() { return false; }
  showing_on_its_workspace() { return !this.minimized; }
  get_frame_rect() { return { ...this.frame }; }
  stage_to_protocol_rect(rect) {
    return { ...rect, width: rect.width / this.geometryScale, height: rect.height / this.geometryScale };
  }
  is_above() { return this.above; }
  make_above() { this.above = true; }
  unmake_above() { this.above = false; }
  minimize() { this.minimized = true; this.emit("notify::minimized"); }
  unminimize() { this.minimized = false; this.emit("notify::minimized"); }
  change_workspace(workspace) { this.workspace = workspace; this.emit("workspace-changed"); }
  raise() { this.raises += 1; }

  move_frame(userOp, x, y) {
    assert.equal(this.identity, "quota-float", "only the widget may be moved");
    assert.equal(userOp, false);
    this.frame = { ...this.frame, x, y };
    this.moves.push({ x, y });
    this.emit("position-changed");
  }
}

async function setup() {
  const workspace = {};
  const host = new Window("com.openai.codex", { x: 100, y: 40, width: 830, height: 594 }, workspace);
  const widget = new Window("quota-float", { x: 0, y: 0, width: 100, height: 100 }, workspace);
  const display = new Signals();
  const workspaceManager = new Signals();
  const callbacks = new Map();
  const timers = new Map();
  let nextId = 1;
  const env = { host, widget, display, workspaceManager, workspace, focused: host, windows: [widget, host], scans: 0 };
  display.get_tab_list = () => { env.scans += 1; return env.windows; };
  display.get_focus_window = () => env.focused;
  workspaceManager.get_active_workspace = () => env.workspace;
  const laters = {
    add(type, callback) {
      assert.equal(type, "BEFORE_REDRAW");
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    remove(id) { assert.ok(callbacks.delete(id), "pending redraw must be removed exactly once"); },
  };
  const GLib = {
    PRIORITY_DEFAULT: 0, SOURCE_CONTINUE: true, SOURCE_REMOVE: false,
    timeout_add(priority, interval, callback) {
      assert.equal(interval, 250, "discovery timer must not become a high-frequency polling loop");
      const id = nextId++;
      timers.set(id, callback);
      return id;
    },
    source_remove(id) { assert.ok(timers.delete(id)); },
  };
  const context = vm.createContext({
    global: { display, workspace_manager: workspaceManager, compositor: { get_laters: () => laters } },
  });
  function stub(names, values) {
    return new vm.SyntheticModule(names, function () {
      for (const name of names) this.setExport(name, values[name]);
    }, { context });
  }
  const dependencies = {
    "gi://GLib": stub(["default"], { default: GLib }),
    "gi://Meta": stub(["default"], { default: { TabList: { NORMAL_ALL: 0 }, LaterType: { BEFORE_REDRAW: "BEFORE_REDRAW" } } }),
    "resource:///org/gnome/shell/extensions/extension.js": stub(["Extension"], { Extension: class {} }),
    "./anchor.js": new vm.SourceTextModule(anchorSource, { context }),
  };
  const module = new vm.SourceTextModule(extensionSource, { context });
  await module.link(specifier => {
    assert.ok(specifier in dependencies, `unmocked dependency: ${specifier}`);
    return dependencies[specifier];
  });
  await module.evaluate();
  env.extension = new module.namespace.default();
  env.callbacks = callbacks;
  env.timers = timers;
  env.redraw = () => {
    for (const [id, callback] of [...callbacks]) {
      if (callbacks.delete(id)) assert.equal(callback(), false, "redraw callback must be one-shot");
    }
  };
  env.poll = () => { for (const callback of timers.values()) assert.equal(callback(), true); };
  env.close = window => {
    env.windows = env.windows.filter(candidate => candidate !== window);
    window.emit("unmanaged");
  };
  env.extension.enable();
  return env;
}

test("drag events follow the latest host position before redraw without waiting for discovery", async t => {
  const env = await setup();
  t.after(() => env.extension.disable());
  const { host, widget } = env;
  assert.equal(widget.frame.x, 806);
  assert.equal(widget.frame.y, 374);
  const scans = env.scans;
  const raises = widget.raises;
  const moves = widget.moves.length;
  for (let step = 1; step <= 20; step++) {
    host.frame.x = 100 + step * 8;
    host.frame.y = 40 + step * 3;
    host.emit("position-changed");
  }
  assert.equal(env.callbacks.size, 1, "multiple motion events must share one frame callback");
  assert.equal(widget.moves.length, moves);
  env.redraw();
  assert.equal(widget.frame.x, 966);
  assert.equal(widget.frame.y, 434);
  assert.equal(widget.moves.length, moves + 1);
  assert.equal(env.scans, scans, "dragging must not scan all desktop windows");
  assert.equal(widget.raises, raises, "dragging must not restack the widget every frame");
  assert.equal(env.callbacks.size, 0, "moving the widget must not cause a feedback loop");
  for (let frame = 0; frame < 12; frame++) {
    host.frame.x -= 5;
    host.frame.y += 2;
    host.emit("position-changed");
    env.redraw();
    assert.equal(widget.frame.x, host.frame.x + 830 - 100 - 24);
    assert.equal(widget.frame.y, host.frame.y + 594 - 100 - 160);
  }
  assert.equal(widget.moves.length, moves + 13);
  assert.equal(env.scans, scans);
  assert.equal(widget.raises, raises);
});

test("size, fullscreen, maximize and geometry-scale changes retain the 0.1.12 placement rules", async t => {
  const env = await setup();
  t.after(() => env.extension.disable());
  const { host, widget } = env;
  widget.frame.width = widget.frame.height = 320;
  widget.emit("size-changed"); env.redraw();
  assert.deepEqual([widget.frame.x, widget.frame.y], [586, 290]);
  widget.frame.width = widget.frame.height = 100;
  widget.emit("size-changed"); env.redraw();
  assert.equal(widget.frame.y, 374);
  host.fullscreen = true;
  host.emit("notify::fullscreen"); env.redraw();
  assert.equal(widget.frame.y, 510);
  host.fullscreen = false;
  host.maximized_horizontally = host.maximized_vertically = true;
  host.emit("notify::fullscreen"); host.emit("notify::maximized-horizontally"); env.redraw();
  assert.equal(widget.frame.y, 510);
  host.maximized_horizontally = false;
  host.emit("notify::maximized-horizontally"); env.redraw();
  assert.equal(widget.frame.y, 374);
  host.frame = { x: -2400, y: 40, width: 2400, height: 1800 };
  widget.geometryScale = 2;
  widget.frame.width = widget.frame.height = 200;
  host.emit("size-changed"); widget.emit("size-changed"); env.redraw();
  assert.deepEqual([widget.frame.x, widget.frame.y], [-224, 1344]);
});

test("focus changes replace the host and disconnect old geometry handlers", async t => {
  const env = await setup();
  t.after(() => env.extension.disable());
  const previousHost = env.host;
  const nextHost = new Window("codex", { x: -900, y: 80, width: 700, height: 700 }, env.workspace);
  env.windows.push(nextHost);
  previousHost.emit("position-changed");
  env.focused = nextHost;
  env.display.emit("notify::focus-window");
  assert.equal(env.callbacks.size, 1);
  env.redraw();
  assert.deepEqual([env.widget.frame.x, env.widget.frame.y], [-324, 520]);
  assert.equal(previousHost.connections.size, 0);
  previousHost.emit("position-changed");
  assert.equal(env.callbacks.size, 0);
  env.focused = env.widget;
  env.display.emit("notify::focus-window"); env.redraw();
  nextHost.frame.x -= 40;
  nextHost.emit("position-changed"); env.redraw();
  assert.equal(env.widget.frame.x, -364);
});

test("discovery polling does not accumulate handlers and remains a recovery fallback", async t => {
  const env = await setup();
  t.after(() => env.extension.disable());
  const hostSignals = env.host.connections.size;
  const widgetSignals = env.widget.connections.size;
  for (let i = 0; i < 20; i++) env.poll();
  assert.equal(env.host.connections.size, hostSignals);
  assert.equal(env.widget.connections.size, widgetSignals);
  const lateHost = new Window("codex", { x: 200, y: 100, width: 1000, height: 800 }, env.workspace);
  env.windows.push(lateHost);
  env.focused = lateHost;
  env.poll();
  assert.deepEqual([env.widget.frame.x, env.widget.frame.y], [1076, 640]);
  assert.equal(env.host.connections.size, 0);
});

test("workspace and visibility changes hide and restore the widget without a polling delay", async t => {
  const env = await setup();
  t.after(() => env.extension.disable());
  const workspace = env.workspace;
  env.workspace = {};
  env.workspaceManager.emit("active-workspace-changed"); env.redraw();
  assert.equal(env.widget.minimized, true);
  env.workspace = workspace;
  env.workspaceManager.emit("active-workspace-changed"); env.redraw(); env.redraw();
  assert.equal(env.widget.minimized, false);
  env.host.minimize(); env.redraw(); env.redraw();
  assert.equal(env.widget.minimized, true);
  env.host.unminimize();
  env.display.emit("notify::focus-window"); env.redraw(); env.redraw();
  assert.equal(env.widget.minimized, false);
});

test("destroying a host cancels its pending geometry update before rediscovery", async t => {
  const env = await setup();
  t.after(() => env.extension.disable());
  env.host.emit("position-changed");
  const pending = [...env.callbacks.keys()][0];
  const moves = env.widget.moves.length;
  env.close(env.host);
  assert.equal(env.callbacks.has(pending), false);
  assert.equal(env.host.connections.size, 0);
  env.redraw(); env.redraw();
  assert.equal(env.widget.moves.length, moves);
  assert.equal(env.widget.minimized, true);
});

test("destroying a widget clears its handlers and a new widget is discovered from window-created", async t => {
  const env = await setup();
  t.after(() => env.extension.disable());
  const oldWidget = env.widget;
  env.host.emit("position-changed");
  env.close(oldWidget);
  env.redraw();
  assert.equal(oldWidget.connections.size, 0);
  assert.equal(env.host.connections.size, 0);
  const replacement = new Window("quota-float", { x: 0, y: 0, width: 100, height: 100 }, env.workspace);
  env.windows.unshift(replacement);
  env.display.emit("window-created"); env.redraw();
  assert.deepEqual([replacement.frame.x, replacement.frame.y], [806, 374]);
});

test("disable cancels timers, redraws and connections; re-enable starts one clean watcher set", async () => {
  const env = await setup();
  const hostSignals = env.host.connections.size;
  env.host.emit("position-changed");
  env.extension.disable();
  assert.equal(env.callbacks.size, 0);
  assert.equal(env.timers.size, 0);
  for (const object of [env.host, env.widget, env.display, env.workspaceManager]) assert.equal(object.connections.size, 0);
  assert.equal(env.widget.above, false);
  env.host.emit("position-changed");
  env.display.emit("notify::focus-window");
  assert.equal(env.callbacks.size, 0);
  env.extension.enable();
  assert.equal(env.host.connections.size, hostSignals);
  assert.equal(env.timers.size, 1);
  env.extension.disable();
});
