import { describe, expect, it } from "@jest/globals";
import { useReleaseCardOverlayLayout } from "src/components/ReleaseCard/useReleaseCardOverlayLayout.hook";
import { renderHook } from "test-utils";

describe("useReleaseCardOverlayLayout", () => {
  it("marks table layout and uses table row action classes", () => {
    const { result } = renderHook(() =>
      useReleaseCardOverlayLayout({
        layout: "table",
        notesVariant: "table",
      }),
    );

    expect(result.current.isTable).toBe(true);
    expect(result.current.isVertical).toBe(false);
    expect(result.current.actionClass()).toContain("actionButton");
  });

  it("uses vertical stack classes for drawer-style overlays", () => {
    const { result } = renderHook(() =>
      useReleaseCardOverlayLayout({
        layout: "vertical",
        notesVariant: "mobile",
      }),
    );

    expect(result.current.isVertical).toBe(true);
    expect(result.current.slotClass).toContain("overlayActionSlot");
  });
});
