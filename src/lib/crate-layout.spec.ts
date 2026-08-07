import { describe, expect, it } from "@jest/globals";
import {
  buildCrateLayout,
  crateLayoutItemsToPutRequest,
  filterCrateLayoutForHiddenPacked,
  getCrateLayoutSortableId,
  mergeReorderedVisibleCrateLayout,
  reorderCrateLayoutItems,
} from "src/lib/crate-layout";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { CrateLayoutItem } from "src/types/crate.types";

const buildReleaseItem = (
  instanceId: string,
  sortOrder: number,
): CrateLayoutItem => ({
  kind: "release",
  instance_id: instanceId,
  sort_order: sortOrder,
  release: releaseFactory.build({ instance_id: instanceId }),
  found_at: null,
});

describe("buildCrateLayout", () => {
  it("merges releases and markers by sort_order", () => {
    const layout = buildCrateLayout({
      releases: [
        {
          release: releaseFactory.build({ instance_id: "1" }),
          found_at: null,
          sort_order: 2000,
        },
        {
          release: releaseFactory.build({ instance_id: "2" }),
          found_at: null,
          sort_order: 3000,
        },
      ],
      markers: [{ id: "marker-1", label: "Peak hour", sort_order: 1000 }],
    });

    expect(layout.map((item) => getCrateLayoutSortableId(item))).toEqual([
      "marker:marker-1",
      "release:1",
      "release:2",
    ]);
  });
});

describe("reorderCrateLayoutItems", () => {
  it("moves an item without reassigning sort_order", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];

    const reordered = reorderCrateLayoutItems({
      items,
      activeId: "release:2",
      overId: "release:1",
    });

    expect(
      reordered.map((item) => item.kind === "release" && item.instance_id),
    ).toEqual(["2", "1"]);
    expect(reordered.map((item) => item.sort_order)).toEqual([2000, 1000]);
  });
});

describe("mergeReorderedVisibleCrateLayout", () => {
  it("preserves hidden packed releases while reordering visible rows", () => {
    const fullItems: CrateLayoutItem[] = [
      { kind: "marker", id: "m1", label: "A", sort_order: 1000 },
      buildReleaseItem("1", 2000),
      buildReleaseItem("2", 3000),
      buildReleaseItem("3", 4000),
    ];
    const marker = fullItems[0];
    const release1 = fullItems[1];
    const release3 = fullItems[3];
    if (!(marker && release1 && release3)) {
      throw new Error("Expected marker and release fixture items");
    }
    const visibleItems = [marker, release1, release3];
    const reorderedVisible = [marker, release3, release1];

    const merged = mergeReorderedVisibleCrateLayout({
      fullItems,
      visibleItems,
      reorderedVisibleItems: reorderedVisible,
    });

    expect(merged.map((item) => getCrateLayoutSortableId(item))).toEqual([
      "marker:m1",
      "release:3",
      "release:2",
      "release:1",
    ]);
  });
});

describe("filterCrateLayoutForHiddenPacked", () => {
  it("keeps markers and hides packed releases", () => {
    const items: CrateLayoutItem[] = [
      { kind: "marker", id: "m1", label: "A", sort_order: 1000 },
      buildReleaseItem("1", 2000),
      buildReleaseItem("2", 3000),
    ];

    const filtered = filterCrateLayoutForHiddenPacked({
      items,
      hidePackedItems: true,
      isPacked: (instanceId) => instanceId === "2",
    });

    expect(filtered).toHaveLength(2);
    expect(filtered[0]?.kind).toBe("marker");
    expect(filtered[1]?.kind).toBe("release");
    if (filtered[1]?.kind === "release") {
      expect(filtered[1].instance_id).toBe("1");
    }
  });
});

describe("crateLayoutItemsToPutRequest", () => {
  it("omits id for temporary marker rows", () => {
    const payload = crateLayoutItemsToPutRequest([
      {
        kind: "marker",
        id: "temp-marker-abc",
        label: "New section",
        sort_order: 1000,
      },
      buildReleaseItem("1", 2000),
    ]);

    expect(payload).toEqual([
      { kind: "marker", label: "New section" },
      { kind: "release", instance_id: "1" },
    ]);
  });
});
