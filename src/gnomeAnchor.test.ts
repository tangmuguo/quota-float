import { describe, expect, it } from "vitest";
import {
  BOTTOM_RIGHT_MARGIN,
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
