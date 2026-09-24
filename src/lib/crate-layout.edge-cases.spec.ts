import { CRATE_SECTION_MAX_DEPTH } from "src/constants/crateSectionAccent";
import {
  getCrateLayoutListInsertDropId,
  getCrateLayoutReleaseInstanceIdFromSortableId,
  getCrateLayoutSortableId,
  getCrateLayoutSortableIndex,
  getCrateLayoutSortableIndexLookup,
  getVisibleCrateLayoutItems,
  isCrateLayoutReleaseSortableId,
  reorderCrateLayoutItems,
  resolveCrateLayoutDropIndicator,
} from "src/lib/crate-layout";
import {
  applyCrateLayoutListDragReorder,
  applyResolvedCrateLayoutSectionIds,
  buildCrateLayoutRenderSegments,
  buildVisibleCrateLayoutRenderBundle,
  getCrateLayoutMarkerMap,
  getCrateLayoutRenderSegmentKey,
  getCrateLayoutSectionBlock,
  getCrateLayoutSectionDepth,
  inferCrateLayoutSectionIdForReleaseIndex,
  insertCrateLayoutSubsectionMarker,
  isCrateLayoutReleaseMemberOfSection,
  moveCrateLayoutSectionBeforeSortableId,
  reorderCrateLayoutReleaseOverSectionMarker,
  reorderCrateLayoutVisibleSortableItems,
  reorderVisibleCrateLayoutAfterDrag,
  reparentCrateLayoutMarkersAfterDelete,
  resolveCrateLayoutDropIndicatorForDrag,
  resolveCrateLayoutSectionIds,
  shouldShowCrateLayoutInsertZoneAfterIndex,
  validateCrateLayoutSectionStructure,
} from "src/lib/crate-section-layout";
import { crateLayoutItemFactory as layout } from "src/tests/factories/CrateLayoutItem.factory";

const overRect = { top: 100, left: 8, width: 320, height: 48 };

describe("crateLayoutEdgeCases", () => {
  it("when sortable id is a release prefix, parses the instance id", () => {
    expect(getCrateLayoutReleaseInstanceIdFromSortableId("release:42")).toBe(
      "42",
    );
    expect(isCrateLayoutReleaseSortableId("release:42")).toBe(true);
  });

  it("when sortable id is not a release, returns null for instance parsing", () => {
    expect(
      getCrateLayoutReleaseInstanceIdFromSortableId("marker:a"),
    ).toBeNull();
    expect(isCrateLayoutReleaseSortableId("marker:a")).toBe(false);
  });

  it("when lookup misses an id, getCrateLayoutSortableIndex returns -1", () => {
    const items = layout.list([
      layout.release("1", 1000),
      layout.release("2", 2000),
    ]);
    const lookup = getCrateLayoutSortableIndexLookup(items);

    expect(
      getCrateLayoutSortableIndex({
        items,
        sortableId: "release:missing",
        lookup,
      }),
    ).toBe(-1);
  });

  it("when duplicate instance ids exist in malformed data, lookup keeps the last index", () => {
    const items = layout.list([
      layout.release("dup", 1000),
      layout.release("dup", 2000),
    ]);
    const lookup = getCrateLayoutSortableIndexLookup(items);

    expect(lookup.indexByInstanceId.get("dup")).toBe(1);
    expect(lookup.sortableIds).toEqual(["release:dup", "release:dup"]);
  });

  it("when active and over are the same sortable id, returns null", () => {
    const items = layout.list([layout.release("1", 1000)]);

    expect(
      resolveCrateLayoutDropIndicator({
        items,
        activeSortableId: "release:1",
        overSortableId: "release:1",
        overRect,
      }),
    ).toBeNull();
  });

  it("when either sortable id is missing from the layout, returns null", () => {
    const items = layout.list([layout.release("1", 1000)]);

    expect(
      resolveCrateLayoutDropIndicator({
        items,
        activeSortableId: "release:ghost",
        overSortableId: "release:1",
        overRect,
      }),
    ).toBeNull();
  });

  it("when active and over ids match, returns the original list reference order unchanged", () => {
    const items = layout.list([
      layout.release("1", 1000),
      layout.release("2", 2000),
    ]);

    expect(
      reorderCrateLayoutItems({
        items,
        activeId: "release:1",
        overId: "release:1",
      }),
    ).toBe(items);
  });

  it("when either sortable id is unknown, leaves item order unchanged", () => {
    const items = layout.list([
      layout.release("1", 1000),
      layout.release("2", 2000),
    ]);

    expect(
      reorderCrateLayoutItems({
        items,
        activeId: "release:missing",
        overId: "release:1",
      }),
    ).toEqual(items);
  });

  it("when marker id is absent, returns an empty block", () => {
    expect(
      getCrateLayoutSectionBlock({
        items: layout.list([layout.release("1", 1000)]),
        markerId: "missing",
      }),
    ).toEqual([]);
  });

  it("when a marker has no trailing rows, returns only the marker", () => {
    const items = layout.list([
      layout.release("0", 500),
      layout.marker("solo", 1000),
    ]);

    expect(
      getCrateLayoutSectionBlock({ items, markerId: "solo" }).map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["solo"]);
  });

  it("when a release precedes the next section marker, shows the split control", () => {
    const items = layout.list([
      layout.release("1", 500),
      layout.marker("a", 1000),
      layout.marker("b", 2000),
    ]);

    expect(shouldShowCrateLayoutInsertZoneAfterIndex(items, 0)).toBe(true);
  });

  it("when index is out of range, hides the split control", () => {
    const items = layout.list([layout.release("1", 1000)]);

    expect(shouldShowCrateLayoutInsertZoneAfterIndex(items, 5)).toBe(false);
  });

  it("when an unsectioned release sits between section members, clears trailing stale membership", () => {
    const items = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
      layout.release("gap", 3000, null),
      layout.release("2", 4000, "deep"),
    ]);

    expect(resolveCrateLayoutSectionIds(items)).toEqual([
      { instance_id: "1", section_id: "deep" },
      { instance_id: "gap", section_id: null },
      { instance_id: "2", section_id: null },
    ]);
  });

  it("when a release is physically outside the marker block, clears section_id even if set", () => {
    const items = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
      layout.marker("tail", 3000),
      layout.release("2", 4000, "deep"),
    ]);

    expect(resolveCrateLayoutSectionIds(items)).toEqual([
      { instance_id: "1", section_id: "deep" },
      { instance_id: "2", section_id: null },
    ]);
  });

  it("when no release moved, still re-validates every row section_id", () => {
    const items = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
      layout.release("gap", 3000, null),
      layout.release("2", 4000, "deep"),
    ]);

    const nextItems = applyResolvedCrateLayoutSectionIds(items);

    expect(
      nextItems
        .filter((item) => item.kind === "release")
        .map((item) =>
          item.kind === "release"
            ? ([item.instance_id, item.section_id] as const)
            : null,
        ),
    ).toEqual([
      ["1", "deep"],
      ["gap", null],
      ["2", null],
    ]);
  });

  it("when a release is moved before its section marker, clears membership", () => {
    const reordered = layout.list([
      layout.release("2", 500, "deep"),
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
    ]);

    const nextItems = applyResolvedCrateLayoutSectionIds(reordered, {
      movedInstanceId: "2",
    });

    expect(
      nextItems.find(
        (item) => item.kind === "release" && item.instance_id === "2",
      ),
    ).toMatchObject({ section_id: null });
  });

  it("when dragging a release over its section header from inside the block, targets the top edge", () => {
    const items = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
    ]);
    const bundle = buildVisibleCrateLayoutRenderBundle(items);

    expect(
      resolveCrateLayoutDropIndicatorForDrag({
        items,
        activeSortableId: "release:1",
        overSortableId: "marker:deep",
        overRect,
        sortableIndexLookup: bundle.sortableIndexLookup,
        sectionBlockSortableIdsByMarkerId:
          bundle.sectionBlockSortableIdsByMarkerId,
      }),
    ).toEqual({ top: 100, left: 8, width: 320 });
  });

  it("when dragging a release in the physical section block over the header, targets the top edge", () => {
    const items = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
      layout.release("2", 3000, null),
    ]);
    const bundle = buildVisibleCrateLayoutRenderBundle(items);

    expect(
      resolveCrateLayoutDropIndicatorForDrag({
        items,
        activeSortableId: "release:2",
        overSortableId: "marker:deep",
        overRect,
        sortableIndexLookup: bundle.sortableIndexLookup,
        sectionBlockSortableIdsByMarkerId:
          bundle.sectionBlockSortableIdsByMarkerId,
      }),
    ).toEqual({ top: 100, left: 8, width: 320 });
  });

  it("when dragging a release from above a section onto the header, targets the bottom edge to join under the header", () => {
    const items = layout.list([
      layout.release("0", 500, null),
      layout.release("2", 800, null),
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
    ]);
    const bundle = buildVisibleCrateLayoutRenderBundle(items);

    expect(
      resolveCrateLayoutDropIndicatorForDrag({
        items,
        activeSortableId: "release:2",
        overSortableId: "marker:deep",
        overRect,
        sortableIndexLookup: bundle.sortableIndexLookup,
        sectionBlockSortableIdsByMarkerId:
          bundle.sectionBlockSortableIdsByMarkerId,
      }),
    ).toEqual({ top: 148, left: 8, width: 320 });
  });

  it("when active equals over, delegates to release-over-release null indicator", () => {
    const items = layout.list([
      layout.release("1", 1000),
      layout.release("2", 2000),
    ]);

    expect(
      resolveCrateLayoutDropIndicatorForDrag({
        items,
        activeSortableId: "release:1",
        overSortableId: "release:1",
        overRect,
      }),
    ).toBeNull();
  });

  it("when active and over match, returns the same visible ordering", () => {
    const visibleItems = layout.list([
      layout.release("1", 1000),
      layout.release("2", 2000),
    ]);

    expect(
      reorderCrateLayoutVisibleSortableItems({
        visibleItems,
        activeSortableId: "release:1",
        overSortableId: "release:1",
      }),
    ).toBe(visibleItems);
  });

  it("when a section member is dragged over its header, moves before the section marker", () => {
    const visibleItems = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
      layout.release("2", 3000, "deep"),
    ]);

    expect(
      reorderCrateLayoutReleaseOverSectionMarker({
        items: visibleItems,
        activeSortableId: "release:2",
        markerSortableId: "marker:deep",
      }).map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["2", "deep", "1"]);
  });

  it("when dragging a parent section over an unknown target, leaves layout unchanged", () => {
    const visibleItems = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
    ]);

    expect(
      moveCrateLayoutSectionBeforeSortableId({
        items: visibleItems,
        activeMarkerId: "deep",
        overSortableId: "release:missing",
      }),
    ).toEqual(visibleItems);
  });

  it("when dragging a marker, omits movedInstanceId and still resolves section ids", () => {
    const visibleItems = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
      layout.marker("tail", 3000),
    ]);

    const result = reorderVisibleCrateLayoutAfterDrag({
      visibleItems,
      activeSortableId: "marker:tail",
      overSortableId: "marker:deep",
    });

    expect(result.movedInstanceId).toBeUndefined();
    expect(
      result.nextVisibleItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["tail", "deep", "1"]);
    expect(
      result.nextVisibleItems.find(
        (item) => item.kind === "release" && item.instance_id === "1",
      ),
    ).toMatchObject({ section_id: "deep" });
  });

  it("when layout is empty, returns no segments", () => {
    expect(buildCrateLayoutRenderSegments([])).toEqual([]);
  });

  it("when layout is marker-only, returns one empty section segment", () => {
    const items = layout.list([layout.marker("solo", 1000)]);

    const segments = buildCrateLayoutRenderSegments(items);

    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      kind: "section",
      startIndex: 0,
    });
    if (segments[0]?.kind === "section") {
      expect(segments[0].bodySegments).toEqual([]);
    }
  });

  it("when building segment keys, uses instance id for loose rows and marker id for sections", () => {
    const items = layout.list([
      layout.release("1", 1000),
      layout.marker("deep", 2000),
    ]);
    const segments = buildCrateLayoutRenderSegments(items);
    const loose = segments[0];
    const section = segments[1];

    if (loose?.kind !== "loose" || section?.kind !== "section") {
      throw new Error("expected loose then section segment");
    }

    expect(getCrateLayoutRenderSegmentKey(loose)).toBe("1");
    expect(getCrateLayoutRenderSegmentKey(section)).toBe("deep");
  });

  it("when parent marker is missing, appends the child at the end", () => {
    const fullItems = layout.list([layout.release("1", 1000)]);
    const child = layout.marker("nested", 0, { parent_id: "missing" });

    expect(
      insertCrateLayoutSubsectionMarker({
        fullItems,
        parentMarkerId: "missing",
        marker: child,
      }).map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["1", "nested"]);
  });

  it("when deleting the first section with no predecessor, clears release section_id", () => {
    const items = layout.list([
      layout.marker("only", 1000),
      layout.release("1", 2000, "only"),
    ]);

    const nextItems = reparentCrateLayoutMarkersAfterDelete({
      items,
      deletedMarkerId: "only",
    });

    expect(nextItems.filter((item) => item.kind === "marker")).toHaveLength(0);
    expect(nextItems[0]).toMatchObject({
      kind: "release",
      section_id: null,
    });
  });

  it("when deleting a nested subsection, reparents child markers to the deleted parent", () => {
    const items = layout.list([
      layout.marker("parent", 1000),
      layout.marker("child", 1500, { parent_id: "parent" }),
      layout.release("1", 2000, "parent"),
    ]);

    const nextItems = reparentCrateLayoutMarkersAfterDelete({
      items,
      deletedMarkerId: "child",
    });

    expect(
      nextItems.find((item) => item.kind === "marker" && item.id === "parent"),
    ).toBeDefined();
    expect(
      nextItems.some((item) => item.kind === "marker" && item.id === "child"),
    ).toBe(false);
  });

  it("when release index is zero, returns null", () => {
    const items = layout.list([
      layout.release("1", 1000),
      layout.marker("deep", 2000),
    ]);

    expect(inferCrateLayoutSectionIdForReleaseIndex(items, 0)).toBeNull();
  });

  it("when previous release has an unknown section_id, returns null", () => {
    const items = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "ghost"),
      layout.release("2", 3000, null),
    ]);

    expect(inferCrateLayoutSectionIdForReleaseIndex(items, 2)).toBeNull();
  });

  it("when release is not in the marker physical block, is not a member", () => {
    const items = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
      layout.marker("tail", 3000),
      layout.release("2", 4000, "deep"),
    ]);

    expect(isCrateLayoutReleaseMemberOfSection(items, 3, "deep")).toBe(false);
  });

  it("when an unsectioned gap separates members, trailing row is not a member", () => {
    const items = layout.list([
      layout.marker("deep", 1000),
      layout.release("1", 2000, "deep"),
      layout.release("gap", 3000, null),
      layout.release("2", 4000, "deep"),
    ]);

    expect(isCrateLayoutReleaseMemberOfSection(items, 3, "deep")).toBe(false);
  });

  it("when a child references a missing parent id, rejects the layout", () => {
    const items = layout.list([
      layout.marker("orphan-child", 1000, { parent_id: "missing-parent" }),
    ]);

    expect(validateCrateLayoutSectionStructure(items)).toEqual({
      ok: false,
      error: "Section parent was not found in this layout",
    });
  });

  it("when nesting exceeds max depth, rejects the layout", () => {
    const items = layout.list([
      layout.marker("a", 1000),
      layout.marker("b", 2000, { parent_id: "a" }),
      layout.marker("c", 3000, { parent_id: "b" }),
    ]);
    const markersById = getCrateLayoutMarkerMap(items);

    expect(getCrateLayoutSectionDepth("c", markersById)).toBeGreaterThanOrEqual(
      CRATE_SECTION_MAX_DEPTH,
    );
    expect(validateCrateLayoutSectionStructure(items)).toEqual({
      ok: false,
      error: `Sections may nest at most ${CRATE_SECTION_MAX_DEPTH - 1} level deep`,
    });
  });

  it("when a release references a missing section id, rejects the layout", () => {
    const items = layout.list([layout.release("1", 1000, "ghost-section")]);

    expect(validateCrateLayoutSectionStructure(items)).toEqual({
      ok: false,
      error: "Release section was not found in this layout",
    });
  });

  it("when layout has no markers, accepts releases only", () => {
    expect(
      validateCrateLayoutSectionStructure([layout.release("1", 1000)]),
    ).toEqual({ ok: true });
  });

  it("when dragging a release over another, inserts before the over row in the full layout", () => {
    const fullItems = layout.list([
      layout.release("first", 1000),
      layout.release("second", 2000),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:second",
        overSortableId: "release:first",
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:second", "release:first"]);
  });

  it("when a release drops on the top list insert target with no groups, moves it before the first release", () => {
    const fullItems = layout.list([
      layout.release("first", 1000),
      layout.release("second", 2000),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:second",
        overSortableId: getCrateLayoutListInsertDropId(0),
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:second", "release:first"]);
  });

  it("when a release drops on the bottom list insert target with no groups, moves it after the last release", () => {
    const fullItems = layout.list([
      layout.release("first", 1000),
      layout.release("second", 2000),
      layout.release("third", 3000),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:first",
        overSortableId: getCrateLayoutListInsertDropId(fullItems.length),
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:second", "release:third", "release:first"]);
  });

  it("when a third release drops on layout-insert:0 with no groups, it becomes the first row", () => {
    const fullItems = layout.list([
      layout.release("first", 1000),
      layout.release("second", 2000),
      layout.release("third", 3000),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:third",
        overSortableId: getCrateLayoutListInsertDropId(0),
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:third", "release:first", "release:second"]);
  });

  it("when hide packed is on, dropping on layout-insert:0 merges the visible reorder without moving hidden rows", () => {
    const fullItems = layout.list([
      layout.release("visible-a", 1000),
      layout.release("packed-hidden", 2000),
      layout.release("visible-b", 3000),
    ]);
    const isPacked = (instanceId: string) => instanceId === "packed-hidden";
    const visibleItems = getVisibleCrateLayoutItems({
      items: fullItems,
      hidePackedItems: true,
      isPacked,
      packedEnabled: true,
    });

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems,
        activeSortableId: "release:visible-b",
        overSortableId: getCrateLayoutListInsertDropId(0),
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual([
      "release:visible-b",
      "release:packed-hidden",
      "release:visible-a",
    ]);
  });

  it("when the first visible row is a section marker, layout-insert:0 moves a loose release above the section", () => {
    const fullItems = layout.list([
      layout.marker("sec", 1000),
      layout.release("member", 2000, "sec"),
      layout.release("loose", 3000, null),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:loose",
        overSortableId: getCrateLayoutListInsertDropId(0),
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:loose", "marker:sec", "release:member"]);
  });

  it("when the active release is already first, dropping on layout-insert:0 leaves the full layout unchanged", () => {
    const fullItems = layout.list([
      layout.release("first", 1000),
      layout.release("second", 2000),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:first",
        overSortableId: getCrateLayoutListInsertDropId(0),
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:first", "release:second"]);
  });

  it("when the active release is already last, dropping on the bottom list insert target leaves order unchanged", () => {
    const fullItems = layout.list([
      layout.release("first", 1000),
      layout.release("second", 2000),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:second",
        overSortableId: getCrateLayoutListInsertDropId(fullItems.length),
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:first", "release:second"]);
  });

  it("when a release drops on a middle layout-insert index, inserts at that visible slot", () => {
    const fullItems = layout.list([
      layout.release("first", 1000),
      layout.release("second", 2000),
      layout.release("third", 3000),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:third",
        overSortableId: getCrateLayoutListInsertDropId(1),
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual(["release:first", "release:third", "release:second"]);
  });

  it("when drag reorder targets layout-insert:0, resolveCrateLayoutDropIndicatorForDrag aligns to the insert top edge", () => {
    const items = layout.list([
      layout.release("first", 1000),
      layout.release("second", 2000),
    ]);

    expect(
      resolveCrateLayoutDropIndicatorForDrag({
        items,
        activeSortableId: "release:second",
        overSortableId: getCrateLayoutListInsertDropId(0),
        overRect: { top: 40, left: 12, width: 400, height: 32 },
      }),
    ).toEqual({ top: 40, left: 12, width: 400 });
  });

  it("when a section marker drag targets layout-insert:0, applyCrateLayoutListDragReorder leaves the layout unchanged", () => {
    const fullItems = layout.list([
      layout.marker("sec", 1000),
      layout.release("member", 2000, "sec"),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "marker:sec",
        overSortableId: getCrateLayoutListInsertDropId(0),
      }),
    ).toEqual(fullItems);
  });

  it("when drag reorder active equals over, applyCrateLayoutListDragReorder returns the full layout unchanged", () => {
    const fullItems = layout.list([
      layout.release("1", 1000),
      layout.release("2", 2000),
    ]);

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "release:1",
        overSortableId: "release:1",
      }),
    ).toBe(fullItems);
  });

  it("when hidden packed rows sit between visible releases, drag reorder merges visible order without moving hidden rows", () => {
    const fullItems = layout.list([
      layout.release("visible-a", 1000),
      layout.release("packed-hidden", 2000),
      layout.release("visible-b", 3000),
    ]);
    const isPacked = (instanceId: string) => instanceId === "packed-hidden";
    const visibleItems = getVisibleCrateLayoutItems({
      items: fullItems,
      hidePackedItems: true,
      isPacked,
      packedEnabled: true,
    });

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems,
        activeSortableId: "release:visible-b",
        overSortableId: "release:visible-a",
      }).map((item) => getCrateLayoutSortableId(item)),
    ).toEqual([
      "release:visible-b",
      "release:packed-hidden",
      "release:visible-a",
    ]);
  });

  it("when moving a section above the top section with hidden packed in the top block, keeps the former top section near the top", () => {
    const fullItems = layout.list([
      layout.marker("top", 1000),
      layout.release("top-visible", 2000, "top"),
      layout.release("top-packed", 2500, "top"),
      layout.marker("bottom", 3000),
      layout.release("bottom-visible", 4000, "bottom"),
    ]);
    const isPacked = (instanceId: string) => instanceId === "top-packed";
    const visibleItems = getVisibleCrateLayoutItems({
      items: fullItems,
      hidePackedItems: true,
      isPacked,
      packedEnabled: true,
    });

    const next = applyCrateLayoutListDragReorder({
      fullItems,
      visibleItems,
      activeSortableId: "marker:bottom",
      overSortableId: "marker:top",
    });

    expect(
      next.map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["bottom", "bottom-visible", "top", "top-visible", "top-packed"]);
  });

  it("when drag reorder crosses a section marker on the visible list, applyCrateLayoutListDragReorder resolves section membership on the full layout", () => {
    const fullItems = layout.list([
      layout.marker("sec", 1000),
      layout.release("in-section", 2000, "sec"),
      layout.release("loose", 3000, null),
    ]);
    const visibleItems = fullItems;

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems,
        activeSortableId: "release:loose",
        overSortableId: "release:in-section",
      }).map((item) =>
        item.kind === "release"
          ? `${getCrateLayoutSortableId(item)}:${item.section_id ?? "null"}`
          : getCrateLayoutSortableId(item),
      ),
    ).toEqual(["marker:sec", "release:loose:sec", "release:in-section:sec"]);
  });

  it("when a release is dropped above the first unsectioned row below a section block, applyCrateLayoutListDragReorder keeps it outside the group", () => {
    const fullItems = layout.list([
      layout.marker("sec", 1000),
      layout.release("member", 2000, "sec"),
      layout.release("below", 3000, null),
      layout.release("mover", 500, null),
    ]);
    const visibleItems = fullItems;

    const nextItems = applyCrateLayoutListDragReorder({
      fullItems,
      visibleItems,
      activeSortableId: "release:mover",
      overSortableId: "release:below",
    });

    expect(
      nextItems.map((item) =>
        item.kind === "release" ? item.instance_id : item.id,
      ),
    ).toEqual(["sec", "member", "mover", "below"]);
    expect(resolveCrateLayoutSectionIds(nextItems)).toEqual([
      { instance_id: "member", section_id: "sec" },
      { instance_id: "mover", section_id: null },
      { instance_id: "below", section_id: null },
    ]);
    expect(isCrateLayoutReleaseMemberOfSection(nextItems, 2, "sec")).toBe(
      false,
    );
  });
});
