import { describe, expect, it } from "@jest/globals";
import { CRATE_LAYOUT_SORT_STEP } from "src/constants/crate";
import {
  assignSequentialCrateLayoutSortOrders,
  buildCrateLayout,
  countVisibleCrateReleases,
  crateLayoutItemsToPutRequest,
  filterCrateLayoutForHiddenPacked,
  getCrateLayoutListInsertIndexFromDropId,
  getCrateLayoutSortableId,
  getCrateLayoutSortableIndexLookup,
  getPrependCrateLayoutSortOrder,
  getVisibleCrateLayoutItems,
  insertCrateLayoutMarkerBeforeVisibleIndex,
  mergeReorderedVisibleCrateLayout,
  reorderCrateLayoutItems,
  reorderCrateLayoutReleaseToVisibleInsertIndex,
  resolveCrateLayoutDropIndicator,
} from "src/lib/crate-layout";
import { insertCrateLayoutSubsectionMarker } from "src/lib/crate-section-layout";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  CrateLayoutItem,
  CrateLayoutMarkerItem,
} from "src/types/crate.types";

const buildReleaseItem = (
  instanceId: string,
  sortOrder: number,
  sectionId: string | null = null,
): CrateLayoutItem => ({
  kind: "release",
  instance_id: instanceId,
  sort_order: sortOrder,
  section_id: sectionId,
  release: releaseFactory.build({ instance_id: instanceId }),
  found_at: null,
});

describe("crateLayout", () => {
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
      markers: [
        {
          id: "marker-1",
          label: "Peak hour",
          sort_order: 1000,
          parent_id: null,
          accent_key: null,
        },
      ],
    });

    expect(layout.map((item) => getCrateLayoutSortableId(item))).toEqual([
      "marker:marker-1",
      "release:1",
      "release:2",
    ]);
  });

  it("when moving up over a row, places the line on the top edge of the target", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];

    expect(
      resolveCrateLayoutDropIndicator({
        items,
        activeSortableId: "release:2",
        overSortableId: "release:1",
        overRect: { top: 100, left: 16, width: 400, height: 80 },
      }),
    ).toEqual({ top: 100, left: 16, width: 400 });
  });

  it("when the pointer is in the lower half of a row, places the line on the bottom edge", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];
    const overRect = { top: 200, left: 16, width: 400, height: 80 };

    expect(
      resolveCrateLayoutDropIndicator({
        items,
        activeSortableId: "release:1",
        overSortableId: "release:2",
        overRect,
        pointerY: overRect.top + overRect.height - 1,
      }),
    ).toEqual({ top: 280, left: 16, width: 400 });
  });

  it("when the pointer is in the upper half of a row, places the line on the top edge", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];
    const overRect = { top: 200, left: 16, width: 400, height: 80 };

    expect(
      resolveCrateLayoutDropIndicator({
        items,
        activeSortableId: "release:1",
        overSortableId: "release:2",
        overRect,
        pointerY: overRect.top + 1,
      }),
    ).toEqual({ top: 200, left: 16, width: 400 });
  });

  it("matches findIndex results when a sortable index lookup is provided", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];
    const lookup = getCrateLayoutSortableIndexLookup(items);

    expect(
      resolveCrateLayoutDropIndicator({
        items,
        activeSortableId: "release:1",
        overSortableId: "release:2",
        overRect: { top: 200, left: 16, width: 400, height: 80 },
        sortableIndexLookup: lookup,
        pointerY: 279,
      }),
    ).toEqual({ top: 280, left: 16, width: 400 });
  });

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

  it("parses layout-insert drop ids and ignores invalid suffixes", () => {
    expect(getCrateLayoutListInsertIndexFromDropId("layout-insert:0")).toBe(0);
    expect(getCrateLayoutListInsertIndexFromDropId("layout-insert:2")).toBe(2);
    expect(getCrateLayoutListInsertIndexFromDropId("layout-insert:")).toBe(
      null,
    );
    expect(getCrateLayoutListInsertIndexFromDropId("release:1")).toBe(null);
  });

  it("when reorderCrateLayoutReleaseToVisibleInsertIndex targets the top slot, moves the release before earlier rows", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];

    expect(
      reorderCrateLayoutReleaseToVisibleInsertIndex({
        items,
        activeSortableId: "release:2",
        insertIndex: 0,
      }).map((item) => item.kind === "release" && item.instance_id),
    ).toEqual(["2", "1"]);
  });

  it("when parent exists, inserts a child marker at the end of the parent section block", () => {
    const fullItems: CrateLayoutItem[] = [
      {
        kind: "marker",
        id: "early",
        label: "Early Set",
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
      buildReleaseItem("1", 2000, "early"),
    ];
    const childMarker: CrateLayoutMarkerItem = {
      kind: "marker",
      id: "temp-marker-child",
      label: "Deep House",
      sort_order: 0,
      parent_id: "early",
      accent_key: "amber",
    };

    const nextItems = insertCrateLayoutSubsectionMarker({
      fullItems,
      parentMarkerId: "early",
      marker: childMarker,
    });

    expect(
      nextItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["early", "1", "temp-marker-child"]);
    const inserted = nextItems[2];
    if (inserted?.kind !== "marker") {
      throw new Error("Expected child marker");
    }
    expect(inserted.parent_id).toBe("early");
  });

  it("preserves hidden packed releases while reordering visible rows", () => {
    const fullItems: CrateLayoutItem[] = [
      {
        kind: "marker",
        id: "m1",
        label: "A",
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
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

  it("keeps markers and hides packed releases", () => {
    const items: CrateLayoutItem[] = [
      {
        kind: "marker",
        id: "m1",
        label: "A",
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
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

  it("omits id for temporary marker rows", () => {
    const payload = crateLayoutItemsToPutRequest([
      {
        kind: "marker",
        id: "temp-marker-abc",
        label: "New section",
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
      buildReleaseItem("1", 2000),
    ]);

    expect(payload).toEqual([
      {
        kind: "marker",
        id: "temp-marker-abc",
        label: "New section",
        parent_id: null,
        accent_key: null,
      },
      { kind: "release", instance_id: "1", section_id: null },
    ]);
  });

  it("returns the first step for an empty crate", () => {
    expect(getPrependCrateLayoutSortOrder([])).toBe(1000);
  });

  it("returns a sort order below the current minimum layout position", () => {
    expect(getPrependCrateLayoutSortOrder([1000, 2000, 3500])).toBe(0);
  });

  it("when hide packed is enabled but packed mode is off, still shows packed releases", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];

    expect(
      getVisibleCrateLayoutItems({
        items,
        hidePackedItems: true,
        isPacked: (id) => id === "2",
        packedEnabled: false,
      }),
    ).toHaveLength(2);
  });

  it("when hide packed is off, countVisibleCrateReleases counts every release row", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];

    expect(
      countVisibleCrateReleases({
        items,
        hidePackedItems: true,
        isPacked: () => true,
        packedEnabled: false,
      }),
    ).toBe(2);
  });

  it("when hide packed is on and packed mode is enabled, countVisibleCrateReleases excludes packed releases", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
      buildReleaseItem("3", 3000),
    ];

    expect(
      countVisibleCrateReleases({
        items,
        hidePackedItems: true,
        isPacked: (instanceId) => instanceId === "2",
        packedEnabled: true,
      }),
    ).toBe(2);
  });

  it("when filtering hidden packed rows, always keeps section markers", () => {
    const items: CrateLayoutItem[] = [
      {
        kind: "marker",
        id: "m1",
        label: "A",
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
      buildReleaseItem("1", 2000),
      buildReleaseItem("2", 3000),
    ];

    const filtered = filterCrateLayoutForHiddenPacked({
      items,
      hidePackedItems: true,
      isPacked: (instanceId) => instanceId === "2",
    });

    expect(filtered.map((item) => getCrateLayoutSortableId(item))).toEqual([
      "marker:m1",
      "release:1",
    ]);
  });

  it("when reordering visible rows, leaves hidden packed releases in their full-layout slots", () => {
    const fullItems: CrateLayoutItem[] = [
      {
        kind: "marker",
        id: "m1",
        label: "A",
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
      buildReleaseItem("1", 2000),
      buildReleaseItem("2", 3000),
      buildReleaseItem("3", 4000),
    ];
    const marker = fullItems[0];
    const release1 = fullItems[1];
    const release3 = fullItems[3];
    if (!(marker && release1 && release3)) {
      throw new Error("Expected layout fixture items");
    }
    const visibleItems = [marker, release1, release3];
    const reorderedVisible = [marker, release3, release1];

    expect(
      mergeReorderedVisibleCrateLayout({
        fullItems,
        visibleItems,
        reorderedVisibleItems: reorderedVisible,
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["marker:m1", "release:3", "release:2", "release:1"]);
  });

  it("when assigning sequential sort orders, uses the layout sort step for each position", () => {
    const items: CrateLayoutItem[] = [
      buildReleaseItem("1", 999),
      buildReleaseItem("2", 1),
    ];

    expect(
      assignSequentialCrateLayoutSortOrders(items).map(
        (item) => item.sort_order,
      ),
    ).toEqual([CRATE_LAYOUT_SORT_STEP, CRATE_LAYOUT_SORT_STEP * 2]);
  });

  it("when inserting a marker at visible index zero, splices before the first visible row in the full layout", () => {
    const fullItems: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
    ];
    const visibleItems = fullItems;
    const marker: CrateLayoutMarkerItem = {
      kind: "marker",
      id: "new",
      label: "New",
      sort_order: 0,
      parent_id: null,
      accent_key: null,
    };

    expect(
      insertCrateLayoutMarkerBeforeVisibleIndex({
        fullItems,
        visibleItems,
        insertIndex: 0,
        marker,
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["marker:new", "release:1", "release:2"]);
  });

  it("when visible layout is empty, appends a new marker to the full layout", () => {
    const fullItems: CrateLayoutItem[] = [buildReleaseItem("1", 1000)];
    const marker: CrateLayoutMarkerItem = {
      kind: "marker",
      id: "new",
      label: "New",
      sort_order: 0,
      parent_id: null,
      accent_key: null,
    };

    expect(
      insertCrateLayoutMarkerBeforeVisibleIndex({
        fullItems,
        visibleItems: [],
        insertIndex: 0,
        marker,
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:1", "marker:new"]);
  });

  it("when inserting after the last visible row, splices after that row in the full layout", () => {
    const fullItems: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
      buildReleaseItem("3", 3000),
    ];
    const visibleItems = [fullItems[0], fullItems[2]].filter(
      (item): item is CrateLayoutItem => item !== undefined,
    );
    const marker: CrateLayoutMarkerItem = {
      kind: "marker",
      id: "tail",
      label: "Tail",
      sort_order: 0,
      parent_id: null,
      accent_key: null,
    };

    expect(
      insertCrateLayoutMarkerBeforeVisibleIndex({
        fullItems,
        visibleItems,
        insertIndex: visibleItems.length,
        marker,
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:1", "release:2", "release:3", "marker:tail"]);
  });

  it("when inserting before a later visible row, splices into the full layout at that row", () => {
    const fullItems: CrateLayoutItem[] = [
      buildReleaseItem("1", 1000),
      buildReleaseItem("2", 2000),
      buildReleaseItem("3", 3000),
    ];
    const visibleItems = [fullItems[0], fullItems[2]].filter(
      (item): item is CrateLayoutItem => item !== undefined,
    );
    const marker: CrateLayoutMarkerItem = {
      kind: "marker",
      id: "split",
      label: "Split",
      sort_order: 0,
      parent_id: null,
      accent_key: null,
    };

    expect(
      insertCrateLayoutMarkerBeforeVisibleIndex({
        fullItems,
        visibleItems,
        insertIndex: 1,
        marker,
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:1", "release:2", "marker:split", "release:3"]);
  });
});
