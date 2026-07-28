import { beforeEach, describe, expect, it } from "@jest/globals";
import { useDraggablePanel } from "src/hooks/useDraggablePanel.hook";
import { act, render, renderHook, screen, waitFor } from "test-utils";

function DraggablePanelHarness({
  enabled = true,
  storageKey = "test-panel-layout",
}: {
  enabled?: boolean;
  storageKey?: string;
}) {
  const { panelRef, position, scale, resetLayout } = useDraggablePanel({
    enabled,
    storageKey,
  });

  return (
    <div>
      <div
        ref={panelRef}
        data-testid="fmdDraggablePanelHarness"
        data-position={position ? `${position.x},${position.y}` : "null"}
        style={{ width: 320, height: 200, position: "fixed" }}
      />
      <div data-testid="fmdDraggablePanelScale">{scale}</div>
      <button type="button" onClick={resetLayout}>
        Reset layout
      </button>
    </div>
  );
}

describe("useDraggablePanel", () => {
  beforeEach(() => {
    sessionStorage.clear();

    Element.prototype.getBoundingClientRect = jest.fn(function (this: Element) {
      if (this.getAttribute("data-testid") === "fmdDraggablePanelHarness") {
        return {
          x: 0,
          y: 0,
          width: 320,
          height: 200,
          top: 0,
          left: 0,
          right: 320,
          bottom: 200,
          toJSON: () => ({}),
        };
      }

      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        toJSON: () => ({}),
      };
    });
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

  it("restores a stored layout after the panel has dimensions", async () => {
    sessionStorage.setItem(
      "test-panel-layout",
      JSON.stringify({ position: { x: 120, y: 80 }, scale: 0.75 }),
    );

    render(<DraggablePanelHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("fmdDraggablePanelHarness")).toHaveAttribute(
        "data-position",
        "120,80",
      );
    });
    expect(screen.getByTestId("fmdDraggablePanelScale")).toHaveTextContent(
      "0.75",
    );
  });

  it("restores legacy position-only sessionStorage values", async () => {
    sessionStorage.setItem(
      "test-panel-layout",
      JSON.stringify({ x: 120, y: 80 }),
    );

    render(<DraggablePanelHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("fmdDraggablePanelHarness")).toHaveAttribute(
        "data-position",
        "120,80",
      );
    });
    expect(screen.getByTestId("fmdDraggablePanelScale")).toHaveTextContent("1");
  });

  it("falls back to the docked default when a stored position no longer fits", async () => {
    sessionStorage.setItem(
      "test-panel-layout",
      JSON.stringify({ position: { x: 2000, y: 80 }, scale: 1 }),
    );

    render(<DraggablePanelHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("fmdDraggablePanelHarness")).toHaveAttribute(
        "data-position",
        "null",
      );
    });
    await waitFor(() => {
      expect(sessionStorage.getItem("test-panel-layout")).toBeNull();
    });
  });

  it("clears a stored layout when resetLayout is called", async () => {
    sessionStorage.setItem(
      "test-panel-layout",
      JSON.stringify({ position: { x: 120, y: 80 }, scale: 0.75 }),
    );

    render(<DraggablePanelHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("fmdDraggablePanelHarness")).toHaveAttribute(
        "data-position",
        "120,80",
      );
    });

    act(() => {
      screen.getByRole("button", { name: "Reset layout" }).click();
    });

    expect(screen.getByTestId("fmdDraggablePanelHarness")).toHaveAttribute(
      "data-position",
      "null",
    );
    expect(screen.getByTestId("fmdDraggablePanelScale")).toHaveTextContent("1");
    expect(sessionStorage.getItem("test-panel-layout")).toBeNull();
  });
});
