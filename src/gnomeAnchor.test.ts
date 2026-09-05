import { describe, expect, it } from "vitest";
import {
  BOTTOM_RIGHT_MARGIN,
  COMPACT_BOTTOM_MARGIN,
  isChatGptIdentity,
  isQuotaFloatIdentity,
  needsMove,
  selectHostCandidate,
  targetFrame,
} from "../src-tauri/gnome-extension/quota-float-anchor@quotafloat.app/anchor.js";

describe("GNOME Shell ChatGPT anchor", () => {
  it("anchors a widget to the host frame's lower-right corner without resizing it", () => {
    const widget = { x: 0, y: 0, width: 320, height: 320 };
    const target = targetFrame({ x: 100, y: 40, width: 1400, height: 900 }, widget);

    expect(target).toEqual({
      x: 1500 - 320 - BOTTOM_RIGHT_MARGIN,
      y: 940 - 320 - BOTTOM_RIGHT_MARGIN,
    });
    expect(target).not.toHaveProperty("width");
    expect(target).not.toHaveProperty("height");
  });

  it("keeps the widget within a small or negatively positioned host window", () => {
    const target = targetFrame(
      { x: -1920, y: -120, width: 180, height: 140 },
      { x: 0, y: 0, width: 320, height: 320 },
    );

    expect(target).toEqual({ x: -1920, y: -120 });
  });

  it("does not request another compositor move when the frame is already anchored", () => {
    const current = { x: 956, y: 596, width: 320, height: 320 };
    const target = targetFrame({ x: 0, y: 0, width: 1300, height: 940 }, current);

    expect(target).toEqual({ x: 956, y: 596 });
    expect(needsMove(current, target)).toBe(false);
  });

  it("lifts the compact widget above input buttons in a restored ChatGPT window", () => {
    const host = { x: 100, y: 40, width: 830, height: 594 };
    const widget = { x: 806, y: 510, width: 100, height: 100 };
    const button = { x: 862, y: 570, width: 40, height: 40 };
    const target = targetFrame(host, widget);

    // The original lower-right position intersects the input/voice button.
    expect(widget.x).toBeLessThan(button.x + button.width);
    expect(widget.x + widget.width).toBeGreaterThan(button.x);
    expect(widget.y).toBeLessThan(button.y + button.height);
    expect(widget.y + widget.height).toBeGreaterThan(button.y);
    // Match the approved preview's height while keeping the same right edge.
    expect(target).toEqual({ x: widget.x, y: widget.y - 136 });
    expect(target.y + widget.height).toBeLessThan(button.y - BOTTOM_RIGHT_MARGIN);
    expect(host.y + host.height - target.y - widget.height).toBe(COMPACT_BOTTOM_MARGIN);
    expect(target).not.toHaveProperty("width");
    expect(target).not.toHaveProperty("height");
  });

  it.each([
    { maximizedHorizontally: true, maximizedVertically: false },
    { maximizedHorizontally: false, maximizedVertically: true },
  ])("keeps input clearance for a host maximized along only one axis: %j", (state) => {
    const host = { x: -1920, y: 40, width: 960, height: 1040 };
    const widget = { x: 0, y: 0, width: 100, height: 100 };

    expect(targetFrame(host, widget, BOTTOM_RIGHT_MARGIN, state)).toEqual({ x: -1084, y: 820 });
  });

  it.each([
    { fullscreen: true },
    { maximizedHorizontally: true, maximizedVertically: true },
  ])("restores the compact widget's original margin in a screen-filling host: %j", (state) => {
    const host = { x: 0, y: 0, width: 1920, height: 1080 };
    const widget = { x: 1796, y: 820, width: 100, height: 100 };

    expect(targetFrame(host, widget, BOTTOM_RIGHT_MARGIN, state)).toEqual({ x: 1796, y: 956 });
  });

  it.each([
    {},
    { fullscreen: true },
    { maximizedHorizontally: true, maximizedVertically: true },
    { maximizedVertically: true },
  ])("preserves the expanded panel's original lower-right anchor: %j", (state) => {
    const host = { x: 100, y: 40, width: 830, height: 594 };
    const widget = { x: 0, y: 0, width: 320, height: 320 };

    expect(targetFrame(host, widget, BOTTOM_RIGHT_MARGIN, state)).toEqual({ x: 586, y: 290 });
  });

  it.each([1, 1.25, 1.5, 2, 3])("converts the compact lift with geometry scale %s without changing other anchors", (scale) => {
    const host = { x: -2400, y: 40, width: 2400, height: 1800 };
    const widget = { x: 0, y: 0, width: 100 * scale, height: 100 * scale };
    const options = { widgetGeometryScale: scale };
    const defaultY = 1840 - widget.height - BOTTOM_RIGHT_MARGIN;
    const target = targetFrame(host, widget, BOTTOM_RIGHT_MARGIN, options);

    expect(target.x).toBe(-widget.width - BOTTOM_RIGHT_MARGIN);
    expect(defaultY - target.y).toBe(136 * scale);
    expect(targetFrame(host, widget, BOTTOM_RIGHT_MARGIN, { ...options, fullscreen: true }).y).toBe(defaultY);

    const panel = { ...widget, width: 320 * scale, height: 320 * scale };
    expect(targetFrame(host, panel, BOTTOM_RIGHT_MARGIN, options)).toEqual({
      x: -panel.width - BOTTOM_RIGHT_MARGIN,
      y: 1840 - panel.height - BOTTOM_RIGHT_MARGIN,
    });
  });

  it("keeps the original third-argument custom margin", () => {
    const host = { x: 100, y: 40, width: 830, height: 594 };
    expect(targetFrame(host, { x: 0, y: 0, width: 320, height: 320 }, 40)).toEqual({ x: 570, y: 274 });
    expect(targetFrame(host, { x: 0, y: 0, width: 100, height: 100 }, 40)).toEqual({ x: 790, y: 358 });
  });

  it("clamps the lifted orb to the top of an unusually short host", () => {
    const target = targetFrame(
      { x: -960, y: -120, width: 180, height: 200 },
      { x: 0, y: 0, width: 100, height: 100 },
    );

    expect(target).toEqual({ x: -904, y: -120 });
  });

  it("reanchors after host and widget changes without cumulative drift", () => {
    const host = { x: 100, y: 40, width: 830, height: 594 };
    let widget = { x: 586, y: 290, width: 320, height: 320 };
    widget = { ...widget, width: 100, height: 100 };
    widget = { ...widget, ...targetFrame(host, widget) };
    expect(widget).toEqual({ x: 806, y: 374, width: 100, height: 100 });
    expect(needsMove(widget, targetFrame(host, widget))).toBe(false);

    const movedHost = { ...host, x: -900, y: 80, width: 700, height: 700 };
    widget = { ...widget, ...targetFrame(movedHost, widget) };
    expect(widget).toEqual({ x: -324, y: 520, width: 100, height: 100 });
    expect(needsMove(widget, targetFrame(movedHost, widget))).toBe(false);

    widget = { ...widget, width: 320, height: 320 };
    expect(targetFrame(movedHost, widget)).toEqual({ x: -544, y: 436 });
  });

  it("recognizes ChatGPT when several identity fields independently contain codex", () => {
    expect(isChatGptIdentity(["codex", "codex", "com.openai.codex", null])).toBe(true);
    expect(isQuotaFloatIdentity(["quota-float", "app.quotafloat.desktop"])).toBe(true);
    expect(isChatGptIdentity(["org.gnome.Terminal", "terminal"])).toBe(false);
  });

  it("anchors to the focused ChatGPT window even when another window is larger", () => {
    const larger = { id: "large" };
    const focused = { id: "focused-small" };
    const widget = { id: "widget" };

    expect(selectHostCandidate([larger, focused], focused, widget, larger)).toBe(focused);
  });

  it("retains the last host while the user interacts with the widget", () => {
    const recent = { id: "recent" };
    const lastHost = { id: "last" };
    const widget = { id: "widget" };

    expect(selectHostCandidate([recent, lastHost], widget, widget, lastHost)).toBe(lastHost);
    expect(selectHostCandidate([recent], widget, widget, null)).toBe(recent);
  });
});
