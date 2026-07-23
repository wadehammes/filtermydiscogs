import { beforeEach, describe, expect, it } from "@jest/globals";
import { useDraggablePanel } from "src/hooks/useDraggablePanel.hook";
import { act, renderHook } from "test-utils";

describe("useDraggablePanel", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns a null position and full scale by default", () => {
    const { result } = renderHook(() =>
      useDraggablePanel({ enabled: true, storageKey: "test-panel-layout" }),
    );

    expect(result.current.position).toBeNull();
    expect(result.current.scale).toBe(1);
    expect(result.current.isDragging).toBe(false);
    expect(result.current.isResizing).toBe(false);
  });

  it("restores a stored layout from sessionStorage", () => {
    sessionStorage.setItem(
      "test-panel-layout",
      JSON.stringify({ position: { x: 120, y: 80 }, scale: 0.75 }),
    );

    const { result } = renderHook(() =>
      useDraggablePanel({ enabled: true, storageKey: "test-panel-layout" }),
    );

    expect(result.current.position).toEqual({ x: 120, y: 80 });
    expect(result.current.scale).toBe(0.75);
  });

  it("restores legacy position-only sessionStorage values", () => {
    sessionStorage.setItem(
      "test-panel-layout",
      JSON.stringify({ x: 120, y: 80 }),
    );

    const { result } = renderHook(() =>
      useDraggablePanel({ enabled: true, storageKey: "test-panel-layout" }),
    );

    expect(result.current.position).toEqual({ x: 120, y: 80 });
    expect(result.current.scale).toBe(1);
  });

  it("clears a stored layout when resetLayout is called", () => {
    sessionStorage.setItem(
      "test-panel-layout",
      JSON.stringify({ position: { x: 120, y: 80 }, scale: 0.75 }),
    );

    const { result } = renderHook(() =>
      useDraggablePanel({ enabled: true, storageKey: "test-panel-layout" }),
    );

    act(() => {
      result.current.resetLayout();
    });

    expect(result.current.position).toBeNull();
    expect(result.current.scale).toBe(1);
    expect(sessionStorage.getItem("test-panel-layout")).toBeNull();
  });
});
