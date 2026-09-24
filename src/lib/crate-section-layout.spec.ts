import { CRATE_SECTION_MAX_DEPTH } from "src/constants/crateSectionAccent";
import {
  applyCrateLayoutListDragReorder,
  applyResolvedCrateLayoutSectionIds,
  buildCrateLayoutRenderSegments,
  buildCrateLayoutSectionRenderBlock,
  buildVisibleCrateLayoutRenderBundle,
  CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX,
  type CrateLayoutRenderSegment,
  createCrateLayoutRenderBuildContext,
  filterCrateLayoutMarkerDragCollisions,
  getCrateLayoutInsertIndexAtSectionBodyTail,
  getCrateLayoutMarkerMap,
  getCrateLayoutSectionBlock,
  getCrateLayoutSectionBlockSortableIdsByMarkerId,
  getCrateLayoutSectionDepth,
  inferCrateLayoutSectionIdForReleaseIndex,
  insertCrateLayoutSubsectionMarker,
  isCrateLayoutMarkerDescendantOf,
  isCrateLayoutReleaseMemberOfSection,
  isCrateLayoutSectionMoveOverSortableId,
  isCrateLayoutSectionReleaseDropZoneId,
  moveCrateLayoutSectionBeforeSortableId,
  reorderCrateLayoutVisibleSortableItems,
  reorderVisibleCrateLayoutAfterDrag,
  reparentCrateLayoutMarkersAfterDelete,
  resolveCrateLayoutDropIndicatorForDrag,
  resolveCrateLayoutSectionIds,
  shouldShowCrateLayoutInsertZoneAfterIndex,
  shouldShowCrateLayoutInsertZoneAtSectionBodyTail,
  shouldShowCrateLayoutSectionMemberEndDropZone,
  validateCrateLayoutSectionStructure,
} from "src/lib/crate-section-layout";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  CrateLayoutItem,
  CrateLayoutMarkerItem,
} from "src/types/crate.types";

const marker = (
  id: string,
  sortOrder: number,
  options: Partial<CrateLayoutMarkerItem> = {},
): CrateLayoutMarkerItem => ({
  kind: "marker",
  id,
  label: id,
  sort_order: sortOrder,
  parent_id: null,
  accent_key: null,
  ...options,
});

const release = (
  instanceId: string,
  sortOrder: number,
  sectionId: string | null = null,
) => ({
  kind: "release" as const,
  instance_id: instanceId,
  sort_order: sortOrder,
  section_id: sectionId,
  release: releaseFactory.build({ instance_id: instanceId }),
  found_at: null,
});

const collectReleaseInstanceIdsFromRenderSegments = (
  segments: CrateLayoutRenderSegment[],
): string[] => {
  const ids: string[] = [];

  const walk = (segment: CrateLayoutRenderSegment) => {
    if (segment.kind === "loose") {
      ids.push(segment.item.instance_id);
      return;
    }

    for (const bodySegment of segment.bodySegments) {
      walk(bodySegment);
    }
  };

  for (const segment of segments) {
    walk(segment);
  }

  return ids;
};

describe("crateSectionLayout", () => {
  it("when parent already has member releases, appends the child marker after them", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      release("2", 3000, "deep"),
    ];
    const childMarker = marker("nested", 0, { parent_id: "deep" });

    const nextItems = insertCrateLayoutSubsectionMarker({
      fullItems: items,
      parentMarkerId: "deep",
      marker: childMarker,
    });

    expect(
      nextItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["deep", "1", "2", "nested"]);
    expect(
      buildCrateLayoutSectionRenderBlock(nextItems, "deep").map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["deep", "1", "2", "nested"]);
  });

  it("returns 0 for top-level markers", () => {
    const markers = getCrateLayoutMarkerMap([
      marker("early", 1000),
      marker("deep", 2000, { parent_id: "early" }),
    ]);

    expect(getCrateLayoutSectionDepth("early", markers)).toBe(0);
    expect(getCrateLayoutSectionDepth("deep", markers)).toBe(1);
  });

  it("rejects depth beyond the configured maximum", () => {
    const markers = getCrateLayoutMarkerMap([
      marker("a", 1000),
      marker("b", 2000, { parent_id: "a" }),
      marker("c", 3000, { parent_id: "b" }),
    ]);

    expect(getCrateLayoutSectionDepth("c", markers)).toBe(2);
    expect(getCrateLayoutSectionDepth("c", markers)).toBeGreaterThan(
      CRATE_SECTION_MAX_DEPTH - 1,
    );
  });

  it("returns a marker and nested content until the next sibling section", () => {
    const items: CrateLayoutItem[] = [
      marker("early", 1000),
      marker("deep", 2000, { parent_id: "early" }),
      release("1", 3000, "deep"),
      release("2", 4000, "deep"),
      marker("late", 5000),
    ];

    const block = getCrateLayoutSectionBlock({
      items,
      markerId: "early",
    });

    expect(
      block.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["early", "deep", "1", "2"]);
  });

  it("when a top-level marker sits before a subsection of another section, does not include that subsection in its block", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      marker("split", 1500),
      marker("nested", 2000, { parent_id: "deep" }),
      release("1", 3000, "deep"),
    ];

    expect(
      getCrateLayoutSectionBlock({ items, markerId: "split" }).map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["split"]);
  });

  it("detects nested markers", () => {
    const markers = getCrateLayoutMarkerMap([
      marker("early", 1000),
      marker("deep", 2000, { parent_id: "early" }),
    ]);

    expect(isCrateLayoutMarkerDescendantOf("deep", "early", markers)).toBe(
      true,
    );
    expect(isCrateLayoutMarkerDescendantOf("early", "deep", markers)).toBe(
      false,
    );
  });

  it("moves an entire section subtree when dragging a parent marker", () => {
    const items: CrateLayoutItem[] = [
      marker("early", 1000),
      marker("deep", 2000, { parent_id: "early" }),
      release("1", 3000, "deep"),
      marker("late", 4000),
      release("2", 5000, "late"),
    ];

    const moved = moveCrateLayoutSectionBeforeSortableId({
      items,
      activeMarkerId: "early",
      overSortableId: "marker:late",
    });

    expect(
      moved.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["early", "deep", "1", "late", "2"]);
  });

  it("when dragging a section over another section member, leaves layout unchanged", () => {
    const items: CrateLayoutItem[] = [
      marker("top", 1000),
      release("a1", 2000, "top"),
      marker("bottom", 3000),
      release("b1", 4000, "bottom"),
    ];

    expect(
      moveCrateLayoutSectionBeforeSortableId({
        items,
        activeMarkerId: "bottom",
        overSortableId: "release:a1",
      }),
    ).toEqual(items);
  });

  it("when dragging a section over another section member, keeps existing section membership", () => {
    const visibleItems: CrateLayoutItem[] = [
      marker("top", 1000),
      release("a1", 2000, "top"),
      marker("bottom", 3000),
      release("b1", 4000, "bottom"),
    ];

    const result = reorderVisibleCrateLayoutAfterDrag({
      visibleItems,
      activeSortableId: "marker:bottom",
      overSortableId: "release:a1",
    });

    expect(result.nextVisibleItems).toEqual(visibleItems);
    expect(resolveCrateLayoutSectionIds(result.nextVisibleItems)).toEqual([
      { instance_id: "a1", section_id: "top" },
      { instance_id: "b1", section_id: "bottom" },
    ]);
  });

  it("when dragging a section over another section marker, moves the block before that section", () => {
    const items: CrateLayoutItem[] = [
      marker("top", 1000),
      release("a1", 2000, "top"),
      marker("bottom", 3000),
      release("b1", 4000, "bottom"),
    ];

    expect(
      moveCrateLayoutSectionBeforeSortableId({
        items,
        activeMarkerId: "bottom",
        overSortableId: "marker:top",
      }).map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["bottom", "b1", "top", "a1"]);
  });

  it("when dragging a section over an unsectioned release in another group's structural block, can insert after that release", () => {
    const fullItems: CrateLayoutItem[] = [
      marker("top", 1000),
      release("member", 2000, "top"),
      release("loose", 3000, null),
      marker("moving", 4000),
      release("in-moving", 5000, "moving"),
    ];
    const result = applyCrateLayoutListDragReorder({
      fullItems,
      visibleItems: fullItems,
      activeSortableId: "marker:moving",
      overSortableId: "release:loose",
      insertBeforeOver: false,
    }).map((item) => (item.kind === "marker" ? item.id : item.instance_id));

    expect(result).toEqual(["top", "member", "loose", "moving", "in-moving"]);
  });

  it("when a parent contains a nested subgroup, render segments list each release once", () => {
    const items: CrateLayoutItem[] = [
      release("main", 500, null),
      marker("parent", 1000),
      marker("nested", 1500, { parent_id: "parent" }),
      release("sub", 2000, "nested"),
    ];

    expect(
      collectReleaseInstanceIdsFromRenderSegments(
        buildCrateLayoutRenderSegments(items),
      ),
    ).toEqual(["main", "sub"]);
  });

  it("when a nested subgroup is dragged onto a main-row release, moves the subtree and promotes the marker to top level without duplicate render rows", () => {
    const fullItems: CrateLayoutItem[] = [
      release("main", 500, null),
      marker("parent", 1000),
      marker("nested", 1500, { parent_id: "parent" }),
      release("sub", 2000, "nested"),
    ];

    const nextItems = applyCrateLayoutListDragReorder({
      fullItems,
      visibleItems: fullItems,
      activeSortableId: "marker:nested",
      overSortableId: "release:main",
      insertBeforeOver: true,
    });

    expect(
      nextItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["nested", "sub", "main", "parent"]);

    expect(
      nextItems.find((item) => item.kind === "marker" && item.id === "nested"),
    ).toMatchObject({ parent_id: null });

    expect(
      collectReleaseInstanceIdsFromRenderSegments(
        buildCrateLayoutRenderSegments(nextItems),
      ),
    ).toEqual(["sub", "main"]);
  });

  it("when a nested subgroup marker is dropped on its own member release, leaves the flat layout unchanged", () => {
    const fullItems: CrateLayoutItem[] = [
      release("main", 500, null),
      marker("parent", 1000),
      marker("nested", 1500, { parent_id: "parent" }),
      release("sub", 2000, "nested"),
    ];

    expect(
      applyCrateLayoutListDragReorder({
        fullItems,
        visibleItems: fullItems,
        activeSortableId: "marker:nested",
        overSortableId: "release:sub",
      }),
    ).toEqual(fullItems);
  });

  it("when a nested subgroup is reordered before a parent member release, keeps parent_id and flat order", () => {
    const fullItems: CrateLayoutItem[] = [
      marker("parent", 1000),
      release("parent-member", 1200, "parent"),
      marker("nested", 1500, { parent_id: "parent" }),
      release("sub", 2000, "nested"),
    ];

    const nextItems = applyCrateLayoutListDragReorder({
      fullItems,
      visibleItems: fullItems,
      activeSortableId: "marker:nested",
      overSortableId: "release:parent-member",
      insertBeforeOver: true,
    });

    expect(
      nextItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["parent", "nested", "sub", "parent-member"]);

    expect(
      nextItems.find((item) => item.kind === "marker" && item.id === "nested"),
    ).toMatchObject({ parent_id: "parent" });
  });

  it("when two nested subgroups share a parent, reordering the second subgroup before the first updates flat order without changing parent_id", () => {
    const fullItems: CrateLayoutItem[] = [
      marker("parent", 1000),
      marker("nested-a", 1500, { parent_id: "parent" }),
      release("a1", 2000, "nested-a"),
      marker("nested-b", 2500, { parent_id: "parent" }),
      release("b1", 3000, "nested-b"),
    ];

    const nextItems = applyCrateLayoutListDragReorder({
      fullItems,
      visibleItems: fullItems,
      activeSortableId: "marker:nested-b",
      overSortableId: "marker:nested-a",
      insertBeforeOver: true,
    });

    expect(
      nextItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["parent", "nested-b", "b1", "nested-a", "a1"]);

    expect(
      nextItems.find(
        (item) => item.kind === "marker" && item.id === "nested-b",
      ),
    ).toMatchObject({ parent_id: "parent" });
  });

  it("allows a nested subgroup marker drag target on a parent member release in the same group", () => {
    const items: CrateLayoutItem[] = [
      marker("parent", 1000),
      marker("nested", 1500, { parent_id: "parent" }),
      release("sub", 2000, "nested"),
      release("parent-member", 2500, "parent"),
    ];
    const { sectionBlockSortableIdsByMarkerId, sortableIndexLookup } =
      buildVisibleCrateLayoutRenderBundle(items);

    expect(
      isCrateLayoutSectionMoveOverSortableId({
        activeMarkerId: "nested",
        overSortableId: "release:parent-member",
        sectionBlockSortableIdsByMarkerId,
        items,
        sortableIndexLookup,
      }),
    ).toBe(true);
  });

  it("when reordering nested subgroups within a parent, render segments still list each release once", () => {
    const fullItems: CrateLayoutItem[] = [
      marker("parent", 1000),
      marker("nested-a", 1500, { parent_id: "parent" }),
      release("a1", 2000, "nested-a"),
      marker("nested-b", 2500, { parent_id: "parent" }),
      release("b1", 3000, "nested-b"),
    ];

    const nextItems = applyCrateLayoutListDragReorder({
      fullItems,
      visibleItems: fullItems,
      activeSortableId: "marker:nested-b",
      overSortableId: "marker:nested-a",
      insertBeforeOver: true,
    });

    expect(
      collectReleaseInstanceIdsFromRenderSegments(
        buildCrateLayoutRenderSegments(nextItems),
      ),
    ).toEqual(["b1", "a1"]);
  });

  it("when two section groups stack in the layout, allows a marker drag target on the unsectioned row between them", () => {
    const items: CrateLayoutItem[] = [
      marker("first", 1000),
      release("a1", 2000, "first"),
      release("between", 3000, null),
      marker("second", 4000),
      release("b1", 5000, "second"),
    ];
    const { sectionBlockSortableIdsByMarkerId, sortableIndexLookup } =
      buildVisibleCrateLayoutRenderBundle(items);

    expect(
      isCrateLayoutSectionMoveOverSortableId({
        activeMarkerId: "second",
        overSortableId: "release:between",
        sectionBlockSortableIdsByMarkerId,
        items,
        sortableIndexLookup,
      }),
    ).toBe(true);
    expect(
      isCrateLayoutSectionMoveOverSortableId({
        activeMarkerId: "second",
        overSortableId: "release:a1",
        sectionBlockSortableIdsByMarkerId,
        items,
        sortableIndexLookup,
      }),
    ).toBe(false);
  });

  it("when a release has no section_id, keeps it unsectioned even below a marker", () => {
    const items: CrateLayoutItem[] = [
      release("0", 500, null),
      marker("early", 1000),
      release("1", 2000, null),
    ];

    expect(resolveCrateLayoutSectionIds(items)).toEqual([
      { instance_id: "0", section_id: null },
      { instance_id: "1", section_id: null },
    ]);
  });

  it("when a release has section_id set, keeps membership only while it stays in the group run", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      release("2", 3000, null),
      release("3", 4000, "deep"),
    ];

    expect(resolveCrateLayoutSectionIds(items)).toEqual([
      { instance_id: "1", section_id: "deep" },
      { instance_id: "2", section_id: null },
      { instance_id: "3", section_id: null },
    ]);
  });

  it("drops section ids that are not present in the layout", () => {
    const items: CrateLayoutItem[] = [
      release("0", 500, "deleted-marker"),
      marker("deep", 1000),
      release("1", 2000, "deep"),
    ];

    expect(resolveCrateLayoutSectionIds(items)).toEqual([
      { instance_id: "0", section_id: null },
      { instance_id: "1", section_id: "deep" },
    ]);
  });

  it("when a release sits above its section marker, clears stale section membership", () => {
    const items: CrateLayoutItem[] = [
      release("1", 1000, "deep"),
      marker("deep", 2000),
      release("2", 3000, "deep"),
    ];

    expect(resolveCrateLayoutSectionIds(items)).toEqual([
      { instance_id: "1", section_id: null },
      { instance_id: "2", section_id: "deep" },
    ]);
  });

  it("moves releases to the preceding section when a split section is removed", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      marker("split", 3000),
      release("2", 4000, "split"),
      release("3", 5000, "split"),
    ];

    const nextItems = reparentCrateLayoutMarkersAfterDelete({
      items,
      deletedMarkerId: "split",
    });

    expect(nextItems.filter((item) => item.kind === "marker")).toHaveLength(1);
    expect(
      nextItems
        .filter((item) => item.kind === "release")
        .map((item) => (item.kind === "release" ? item.section_id : null)),
    ).toEqual(["deep", "deep", "deep"]);
  });

  it("when the next visible row is a section marker, shows the split control before the group", () => {
    const items: CrateLayoutItem[] = [
      release("0", 1000, null),
      marker("deep", 2000),
      release("1", 3000, "deep"),
    ];

    expect(shouldShowCrateLayoutInsertZoneAfterIndex(items, 0)).toBe(true);
  });

  it("when another release follows, shows the split control", () => {
    const items: CrateLayoutItem[] = [
      release("0", 1000, null),
      release("1", 2000, null),
    ];

    expect(shouldShowCrateLayoutInsertZoneAfterIndex(items, 0)).toBe(true);
  });

  it("when the row is last in the list, hides the split control", () => {
    const items: CrateLayoutItem[] = [release("0", 1000, null)];

    expect(shouldShowCrateLayoutInsertZoneAfterIndex(items, 0)).toBe(false);
  });

  it("when two top-level sections stack, shows a split control after the first group", () => {
    const items: CrateLayoutItem[] = [
      marker("first", 1000),
      marker("second", 2000),
    ];

    const segments = buildCrateLayoutRenderSegments(items);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({
      kind: "section",
      showInsertAfter: true,
      startIndex: 0,
    });
    expect(segments[1]).toMatchObject({
      kind: "section",
      showInsertAfter: false,
      startIndex: 1,
    });
  });

  it("when only some releases belong to a section, wraps just those members in the group", () => {
    const items: CrateLayoutItem[] = [
      release("0", 500, null),
      marker("deep", 1000, { accent_key: "rose" }),
      release("1", 2000, "deep"),
      release("2", 3000, null),
    ];

    const segments = buildCrateLayoutRenderSegments(items);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({
      kind: "loose",
      item: items[0],
      itemIndex: 0,
      showInsertAfter: true,
    });

    const section = segments[1];
    expect(section?.kind).toBe("section");

    if (section?.kind !== "section") {
      return;
    }

    expect(section.marker).toBe(items[1]);
    expect(section.block).toEqual([items[1], items[2]]);
    expect(section.startIndex).toBe(1);
    expect(section.showInsertAfter).toBe(true);
    expect(section.bodySegments).toEqual([
      {
        kind: "loose",
        item: items[2],
        itemIndex: 2,
        showInsertAfter: false,
      },
    ]);

    expect(segments[2]).toMatchObject({
      kind: "loose",
      item: items[3],
      itemIndex: 3,
      showInsertAfter: false,
    });
  });

  it("when a subsection is inserted right after the parent marker, keeps the nested group in the parent segment", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000, { accent_key: "rose" }),
      marker("nested", 1500, { parent_id: "deep" }),
      release("1", 2000, "deep"),
      release("2", 3000, "deep"),
    ];

    const segments = buildCrateLayoutRenderSegments(items);

    expect(segments).toHaveLength(1);
    expect(segments[0]?.kind).toBe("section");

    if (segments[0]?.kind !== "section") {
      return;
    }

    expect(segments[0].marker).toBe(items[0]);
    expect(segments[0].block).toEqual(items);
    expect(segments[0].startIndex).toBe(0);
    expect(segments[0].bodySegments).toHaveLength(3);
    expect(segments[0].bodySegments[0]?.kind).toBe("section");
  });

  it("when the body ends in a nested subsection, keeps the parent section-end target and suppresses the nested footer", () => {
    const items: CrateLayoutItem[] = [
      marker("parent", 1000),
      marker("nested", 1500, { parent_id: "parent" }),
      release("1", 2000, "nested"),
    ];
    const segments = buildCrateLayoutRenderSegments(items);
    const parentSegment = segments.find(
      (segment) => segment.kind === "section" && segment.marker.id === "parent",
    );

    expect(parentSegment?.kind).toBe("section");

    if (parentSegment?.kind !== "section") {
      return;
    }

    expect(
      shouldShowCrateLayoutSectionMemberEndDropZone(parentSegment.bodySegments),
    ).toBe(true);

    const nestedSegment = parentSegment.bodySegments.find(
      (segment) => segment.kind === "section" && segment.marker.id === "nested",
    );

    expect(nestedSegment).toMatchObject({
      kind: "section",
      showInsertAfter: true,
      suppressMemberEndDrop: true,
    });
  });

  it("when a nested subgroup is last in the parent body, exposes an insert index at the parent body tail", () => {
    const items: CrateLayoutItem[] = [
      marker("parent", 1000),
      marker("nested", 1500, { parent_id: "parent" }),
      release("1", 2000, "nested"),
    ];
    const segments = buildCrateLayoutRenderSegments(items);

    if (segments[0]?.kind !== "section") {
      return;
    }

    expect(
      shouldShowCrateLayoutInsertZoneAtSectionBodyTail(
        segments[0].bodySegments,
      ),
    ).toBe(true);
    expect(getCrateLayoutInsertIndexAtSectionBodyTail(items, "parent")).toBe(
      items.length,
    );
  });

  it("when a nested subgroup shares a parent body with sibling member releases, the subgroup drag block stops before those siblings", () => {
    const items: CrateLayoutItem[] = [
      marker("parent", 1000),
      marker("nested", 1500, { parent_id: "parent" }),
      release("nested-member", 2000, "nested"),
      release("parent-member", 2500, "parent"),
    ];

    expect(
      getCrateLayoutSectionBlock({ items, markerId: "nested" }).map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["nested", "nested-member"]);
  });

  it("when a nested subgroup marker is dragged to the parent section end, moves it to the bottom of the parent body", () => {
    const items: CrateLayoutItem[] = [
      marker("parent", 1000),
      marker("nested", 1500, { parent_id: "parent" }),
      release("nested-member", 2000, "nested"),
      release("parent-member", 2500, "parent"),
    ];

    expect(
      getCrateLayoutSectionBlock({ items, markerId: "parent" }).map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["parent", "nested", "nested-member", "parent-member"]);

    expect(getCrateLayoutInsertIndexAtSectionBodyTail(items, "parent")).toBe(4);

    const ctx = createCrateLayoutRenderBuildContext(items);
    const blockMap = getCrateLayoutSectionBlockSortableIdsByMarkerId(
      items,
      ctx,
    );

    expect(
      isCrateLayoutSectionMoveOverSortableId({
        activeMarkerId: "nested",
        overSortableId: "section-end:parent",
        items,
        sortableIndexLookup: ctx.sortableIndexLookup,
        sectionBlockSortableIdsByMarkerId: blockMap,
      }),
    ).toBe(true);

    const moved = moveCrateLayoutSectionBeforeSortableId({
      items,
      activeMarkerId: "nested",
      overSortableId: "section-end:parent",
    });

    expect(
      moved.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["parent", "parent-member", "nested", "nested-member"]);
  });

  it("shows the parent section-end drop zone when the last body segment is a release", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      marker("nested", 1500, { parent_id: "deep" }),
      release("1", 2000, "deep"),
      release("2", 3000, "deep"),
    ];
    const segments = buildCrateLayoutRenderSegments(items);

    if (segments[0]?.kind !== "section") {
      return;
    }

    expect(
      shouldShowCrateLayoutSectionMemberEndDropZone(segments[0].bodySegments),
    ).toBe(true);
  });

  it("when parent members sit below a new subsection marker, does not render them inside the subsection", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      marker("nested", 1500, { parent_id: "deep" }),
      release("1", 2000, "deep"),
      release("2", 3000, "deep"),
    ];

    expect(buildCrateLayoutSectionRenderBlock(items, "nested")).toEqual([
      items[1],
    ]);
  });

  it("when parent members sit below a subsection marker, keeps them in the parent section render block", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      marker("nested", 1500, { parent_id: "deep" }),
      release("1", 2000, "deep"),
      release("2", 3000, "deep"),
    ];

    expect(
      buildCrateLayoutSectionRenderBlock(items, "deep").map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["deep", "nested", "1", "2"]);
  });

  it("when a top-level section is inserted before a subsection, keeps the new section block to its marker only", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      marker("split", 1500),
      marker("nested", 2000, { parent_id: "deep" }),
      release("1", 3000, "deep"),
      release("2", 4000, "deep"),
    ];

    const segments = buildCrateLayoutRenderSegments(items);

    expect(segments).toHaveLength(5);
    expect(segments.map((segment) => segment.kind)).toEqual([
      "section",
      "section",
      "section",
      "loose",
      "loose",
    ]);

    for (const index of [0, 1, 2]) {
      const segment = segments[index];

      if (segment?.kind !== "section") {
        throw new Error("expected section segment");
      }

      expect(segment.block).toEqual([items[index]]);
      expect(segment.startIndex).toBe(index);
    }

    expect(segments[3]).toMatchObject({
      kind: "loose",
      item: items[3],
      itemIndex: 3,
      showInsertAfter: true,
    });
    expect(segments[4]).toMatchObject({
      kind: "loose",
      item: items[4],
      itemIndex: 4,
      showInsertAfter: false,
    });
  });

  it("when a top-level section splits member releases, keeps the new section outside the parent group", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      marker("split", 2500),
      release("2", 3000, "deep"),
    ];

    const segments = buildCrateLayoutRenderSegments(items);

    expect(segments).toHaveLength(3);

    const parentSection = segments[0];
    expect(parentSection?.kind).toBe("section");

    if (parentSection?.kind === "section") {
      expect(parentSection.block).toEqual([items[0], items[1]]);
      expect(parentSection.showInsertAfter).toBe(true);
      expect(parentSection.bodySegments).toEqual([
        {
          kind: "loose",
          item: items[1],
          itemIndex: 1,
          showInsertAfter: false,
        },
      ]);
    }

    const splitSection = segments[1];
    expect(splitSection?.kind).toBe("section");

    if (splitSection?.kind === "section") {
      expect(splitSection.block).toEqual([items[2]]);
      expect(splitSection.bodySegments).toEqual([]);
    }

    expect(segments[2]).toMatchObject({
      kind: "loose",
      item: items[3],
      itemIndex: 3,
      showInsertAfter: false,
    });
  });

  it("when a release is moved directly under a section marker, assigns section membership", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("2", 2000, null),
      release("1", 3000, null),
    ];

    const nextItems = applyResolvedCrateLayoutSectionIds(items, {
      movedInstanceId: "2",
    });

    expect(
      nextItems.find(
        (item) => item.kind === "release" && item.instance_id === "2",
      ),
    ).toMatchObject({ section_id: "deep" });
  });

  it("when a release is moved below a section member, inherits that section", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      release("2", 3000, null),
    ];

    const nextItems = applyResolvedCrateLayoutSectionIds(items, {
      movedInstanceId: "2",
    });

    expect(
      nextItems.find(
        (item) => item.kind === "release" && item.instance_id === "2",
      ),
    ).toMatchObject({ section_id: "deep" });
  });

  it("when a release is moved between two section members, keeps the trailing member in the section", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      release("3", 3000, null),
      release("2", 4000, "deep"),
    ];

    const nextItems = applyResolvedCrateLayoutSectionIds(items, {
      movedInstanceId: "3",
    });

    expect(
      nextItems
        .filter(
          (item): item is Extract<CrateLayoutItem, { kind: "release" }> =>
            item.kind === "release",
        )
        .map((item) => [item.instance_id, item.section_id] as const),
    ).toEqual([
      ["1", "deep"],
      ["3", "deep"],
      ["2", "deep"],
    ]);
  });

  it("when dragging a release between two section members, keeps every member in the section render block", () => {
    const visibleItems: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      release("2", 3000, "deep"),
      release("3", 4000, null),
    ];

    const { nextVisibleItems } = reorderVisibleCrateLayoutAfterDrag({
      visibleItems,
      activeSortableId: "release:3",
      overSortableId: "release:2",
    });

    expect(
      buildCrateLayoutSectionRenderBlock(nextVisibleItems, "deep").map(
        (item) => (item.kind === "marker" ? item.id : item.instance_id),
      ),
    ).toEqual(["deep", "1", "3", "2"]);
  });

  it("when a release below a section is dragged over the section header, inserts it above the section", () => {
    const visibleItems: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      release("2", 3000, null),
    ];

    expect(
      reorderCrateLayoutVisibleSortableItems({
        visibleItems,
        activeSortableId: "release:2",
        overSortableId: "marker:deep",
      }).map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["2", "deep", "1"]);
  });

  it("when a release is dropped on an empty section zone, inserts under the section header", () => {
    const visibleItems: CrateLayoutItem[] = [
      release("0", 500, null),
      marker("deep", 1000),
    ];

    expect(
      reorderCrateLayoutVisibleSortableItems({
        visibleItems,
        activeSortableId: "release:0",
        overSortableId: "section-empty:deep",
      }).map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["deep", "0"]);
  });

  it("when a release is dropped on the section member end zone, inserts after the last member", () => {
    const visibleItems: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      release("2", 3000, null),
    ];

    expect(
      reorderCrateLayoutVisibleSortableItems({
        visibleItems,
        activeSortableId: "release:2",
        overSortableId: "section-end:deep",
      }).map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["deep", "1", "2"]);
  });

  it("when a release is dropped on the section member end zone with an unsectioned row below, joins the section", () => {
    const visibleItems: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("member", 2000, "deep"),
      release("below", 3000, null),
      release("mover", 500, null),
    ];

    const { nextVisibleItems } = reorderVisibleCrateLayoutAfterDrag({
      visibleItems,
      activeSortableId: "release:mover",
      overSortableId: "section-end:deep",
    });

    expect(
      nextVisibleItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["deep", "member", "mover", "below"]);
    expect(resolveCrateLayoutSectionIds(nextVisibleItems)).toEqual([
      { instance_id: "member", section_id: "deep" },
      { instance_id: "mover", section_id: "deep" },
      { instance_id: "below", section_id: null },
    ]);
    expect(
      isCrateLayoutReleaseMemberOfSection(nextVisibleItems, 2, "deep"),
    ).toBe(true);
  });

  it("when a release hovers the section member end zone, hides the line drop indicator", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
    ];

    expect(
      resolveCrateLayoutDropIndicatorForDrag({
        items,
        activeSortableId: "release:0",
        overSortableId: "section-end:deep",
        overRect: { top: 100, left: 8, width: 320, height: 48 },
      }),
    ).toBeNull();
  });

  it("when filtering marker drag collisions, excludes other section member sortables", () => {
    const items: CrateLayoutItem[] = [
      marker("top", 1000),
      release("a1", 2000, "top"),
      marker("bottom", 3000),
      release("b1", 4000, "bottom"),
    ];
    const sectionBlockSortableIdsByMarkerId =
      getCrateLayoutSectionBlockSortableIdsByMarkerId(
        items,
        createCrateLayoutRenderBuildContext(items),
      );

    expect(
      filterCrateLayoutMarkerDragCollisions(
        [{ id: "release:a1" }, { id: "marker:top" }],
        {
          activeMarkerId: "bottom",
          sectionBlockSortableIdsByMarkerId,
        },
      ).map((collision) => collision.id),
    ).toEqual(["marker:top"]);
  });

  it("when filtering marker drag collisions, ignores sortables in the active section block", () => {
    const items: CrateLayoutItem[] = [
      release("0", 500, null),
      marker("deep", 1000),
      release("1", 2000, "deep"),
    ];
    const sectionBlockSortableIdsByMarkerId =
      getCrateLayoutSectionBlockSortableIdsByMarkerId(
        items,
        createCrateLayoutRenderBuildContext(items),
      );

    expect(
      filterCrateLayoutMarkerDragCollisions(
        [{ id: "release:1" }, { id: "release:0" }],
        {
          activeMarkerId: "deep",
          sectionBlockSortableIdsByMarkerId,
        },
      ).map((collision) => collision.id),
    ).toEqual(["release:0"]);
  });

  it("when filtering marker drag collisions, keeps other empty section drop targets", () => {
    expect(isCrateLayoutSectionReleaseDropZoneId("section-empty:deep")).toBe(
      true,
    );
    expect(isCrateLayoutSectionReleaseDropZoneId("section-end:deep")).toBe(
      true,
    );
    expect(isCrateLayoutSectionReleaseDropZoneId("release:1")).toBe(false);

    expect(
      filterCrateLayoutMarkerDragCollisions(
        [
          { id: `${CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX}deep` },
          { id: `${CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX}other` },
        ],
        { activeMarkerId: "deep" },
      ).map((collision) => collision.id),
    ).toEqual([`${CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX}other`]);
  });

  it("when a section marker is dropped on its own empty insert target, leaves order unchanged", () => {
    const visibleItems: CrateLayoutItem[] = [
      release("0", 500, null),
      marker("deep", 1000),
    ];

    expect(
      reorderCrateLayoutVisibleSortableItems({
        visibleItems,
        activeSortableId: "marker:deep",
        overSortableId: `${CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX}deep`,
      }),
    ).toEqual(visibleItems);
  });

  it("when a section marker is dropped on another section empty insert target, moves before that section", () => {
    const visibleItems: CrateLayoutItem[] = [
      marker("first", 1000),
      marker("second", 2000),
    ];

    expect(
      reorderCrateLayoutVisibleSortableItems({
        visibleItems,
        activeSortableId: "marker:second",
        overSortableId: `${CRATE_LAYOUT_SECTION_EMPTY_DROP_PREFIX}first`,
      }).map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["second", "first"]);
  });

  it("when a release hovers an empty section insert zone, hides the line drop indicator", () => {
    const items: CrateLayoutItem[] = [
      release("0", 500, null),
      marker("deep", 1000),
    ];

    expect(
      resolveCrateLayoutDropIndicatorForDrag({
        items,
        activeSortableId: "release:0",
        overSortableId: "section-empty:deep",
        overRect: { top: 100, left: 8, width: 320, height: 48 },
      }),
    ).toBeNull();
  });

  it("when a release above a section is dragged over the section header, joins under the header", () => {
    const visibleItems: CrateLayoutItem[] = [
      release("0", 500, null),
      release("2", 800, null),
      marker("deep", 1000),
      release("1", 2000, "deep"),
    ];

    expect(
      reorderCrateLayoutVisibleSortableItems({
        visibleItems,
        activeSortableId: "release:2",
        overSortableId: "marker:deep",
      }).map((item) => (item.kind === "marker" ? item.id : item.instance_id)),
    ).toEqual(["0", "deep", "2", "1"]);
  });

  it("when a release is dropped directly under a marker, assigns that section", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, null),
    ];

    expect(inferCrateLayoutSectionIdForReleaseIndex(items, 1)).toBe("deep");
  });

  it("when a release is dropped after an unsectioned row, stays unsectioned", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, null),
      release("2", 3000, null),
    ];

    expect(inferCrateLayoutSectionIdForReleaseIndex(items, 2)).toBeNull();
  });

  it("when inferring a slot above the first unsectioned row below section members, returns null", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("member", 2000, "deep"),
      release("mover", 2500, null),
      release("below", 3000, null),
    ];

    expect(inferCrateLayoutSectionIdForReleaseIndex(items, 2)).toBeNull();
  });

  it("when a release is dragged above the first row below a section, stays outside the group", () => {
    const visibleItems: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("member", 2000, "deep"),
      release("below", 3000, null),
      release("mover", 500, null),
    ];

    const { nextVisibleItems } = reorderVisibleCrateLayoutAfterDrag({
      visibleItems,
      activeSortableId: "release:mover",
      overSortableId: "release:below",
    });

    expect(
      nextVisibleItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["deep", "member", "mover", "below"]);
    expect(resolveCrateLayoutSectionIds(nextVisibleItems)).toEqual([
      { instance_id: "member", section_id: "deep" },
      { instance_id: "mover", section_id: null },
      { instance_id: "below", section_id: null },
    ]);
    expect(
      isCrateLayoutReleaseMemberOfSection(nextVisibleItems, 2, "deep"),
    ).toBe(false);
  });

  it("when a section member is dragged above the first unsectioned row below the group, moves out of the section", () => {
    const visibleItems: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("member", 2000, "deep"),
      release("leaver", 2500, "deep"),
      release("below", 3000, null),
    ];

    const { nextVisibleItems } = reorderVisibleCrateLayoutAfterDrag({
      visibleItems,
      activeSortableId: "release:leaver",
      overSortableId: "release:below",
    });

    expect(
      nextVisibleItems.map((item) =>
        item.kind === "marker" ? item.id : item.instance_id,
      ),
    ).toEqual(["deep", "member", "leaver", "below"]);
    expect(resolveCrateLayoutSectionIds(nextVisibleItems)).toEqual([
      { instance_id: "member", section_id: "deep" },
      { instance_id: "leaver", section_id: null },
      { instance_id: "below", section_id: null },
    ]);
    expect(
      isCrateLayoutReleaseMemberOfSection(nextVisibleItems, 2, "deep"),
    ).toBe(false);
  });

  it("when a release is inserted between two section members, infers membership for the new slot", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      release("mover", 2500, null),
      release("2", 3000, "deep"),
    ];

    expect(inferCrateLayoutSectionIdForReleaseIndex(items, 2)).toBe("deep");
  });

  it("builds segments, sortable ids, and section block membership in one pass", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      marker("tail", 3000),
      release("2", 4000, null),
    ];

    const bundle = buildVisibleCrateLayoutRenderBundle(items);
    const ctx = createCrateLayoutRenderBuildContext(items);

    expect(bundle.layoutSegments).toEqual(
      buildCrateLayoutRenderSegments(items, ctx),
    );
    expect(bundle.sortableIds).toEqual([
      "marker:deep",
      "release:1",
      "marker:tail",
      "release:2",
    ]);
    expect(
      bundle.sectionBlockSortableIdsByMarkerId.get("deep")?.has("release:1"),
    ).toBe(true);
    expect(
      bundle.sectionBlockSortableIdsByMarkerId.get("deep")?.has("release:2"),
    ).toBe(false);
  });

  it("caches each section marker block as sortable ids for drag-over", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000),
      release("1", 2000, "deep"),
      marker("tail", 3000),
      release("2", 4000, null),
    ];
    const { sectionBlockSortableIdsByMarkerId } =
      buildVisibleCrateLayoutRenderBundle(items);

    const blockIds = getCrateLayoutSectionBlockSortableIdsByMarkerId(
      items,
      createCrateLayoutRenderBuildContext(items),
    );

    expect(blockIds.get("deep")).toEqual(
      sectionBlockSortableIdsByMarkerId.get("deep"),
    );
    expect([...(blockIds.get("deep") ?? [])].sort()).toEqual(
      ["marker:deep", "release:1"].sort(),
    );
  });

  it("accepts a valid parent and child marker pair", () => {
    const items: CrateLayoutItem[] = [
      marker("early", 1000),
      marker("deep", 2000, { parent_id: "early" }),
      release("1", 3000, "deep"),
    ];

    expect(validateCrateLayoutSectionStructure(items)).toEqual({ ok: true });
  });

  it("rejects a child marker that appears before its parent in sort order", () => {
    const items: CrateLayoutItem[] = [
      marker("deep", 1000, { parent_id: "early" }),
      marker("early", 2000),
    ];

    expect(validateCrateLayoutSectionStructure(items)).toEqual({
      ok: false,
      error: "Section nesting must follow layout order",
    });
  });

  it("when nesting is at the maximum allowed depth, accepts the layout and renders nested section segments", () => {
    const items: CrateLayoutItem[] = [
      marker("parent", 1000),
      marker("child", 2000, { parent_id: "parent" }),
      release("1", 3000, "parent"),
    ];

    expect(validateCrateLayoutSectionStructure(items)).toEqual({ ok: true });

    const segments = buildCrateLayoutRenderSegments(items);

    expect(segments).toHaveLength(1);
    expect(segments[0]?.kind).toBe("section");

    if (segments[0]?.kind !== "section") {
      throw new Error("expected parent section segment");
    }

    expect(segments[0].bodySegments).toHaveLength(2);
    expect(segments[0].bodySegments[0]?.kind).toBe("section");
    expect(segments[0].bodySegments[1]?.kind).toBe("loose");
  });
});
