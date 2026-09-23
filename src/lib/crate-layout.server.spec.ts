import { describe, expect, it } from "@jest/globals";
import { CRATE_TEMP_MARKER_PREFIX } from "src/constants/crate";
import {
  assignSequentialCrateLayoutSortOrders,
  crateLayoutItemsToPutRequest,
} from "src/lib/crate-layout";
import { buildCrateLayoutUpdate } from "src/lib/crate-layout.server";
import { reparentCrateLayoutMarkersAfterDelete } from "src/lib/crate-section-layout";
import { crateLayoutItemFactory as layout } from "src/tests/factories/CrateLayoutItem.factory";
import type { CrateLayoutPutItem } from "src/types/crate.types";

const crateInstanceIds = new Set(["111", "222", "333"]);

describe("buildCrateLayoutUpdate", () => {
  it("when nested markers and accents are valid, persists section metadata on markers and releases", () => {
    const items: CrateLayoutPutItem[] = [
      { kind: "release", instance_id: "333", section_id: null },
      {
        kind: "marker",
        id: "early-set",
        label: "Early Set",
        parent_id: null,
        accent_key: "slate",
      },
      {
        kind: "marker",
        id: "deep-house",
        label: "Deep House",
        parent_id: "early-set",
        accent_key: "amber",
      },
      { kind: "release", instance_id: "111", section_id: "deep-house" },
      { kind: "release", instance_id: "222", section_id: "deep-house" },
    ];

    const result = buildCrateLayoutUpdate({
      items,
      crateInstanceIds,
      existingMarkerIds: new Set(["early-set", "deep-house"]),
    });

    expect(result).toEqual({
      data: {
        releaseOrders: [
          { instance_id: "333", sort_order: 1000, section_id: null },
          { instance_id: "111", sort_order: 4000, section_id: "deep-house" },
          { instance_id: "222", sort_order: 5000, section_id: "deep-house" },
        ],
        markersToUpsert: [
          {
            id: "early-set",
            label: "Early Set",
            sort_order: 2000,
            parent_id: null,
            accent_key: "slate",
          },
          {
            id: "deep-house",
            label: "Deep House",
            sort_order: 3000,
            parent_id: "early-set",
            accent_key: "amber",
          },
        ],
        markerIdsToKeep: ["early-set", "deep-house"],
      },
    });
  });

  it("when a temp marker id is new, accepts the marker and keeps release section membership", () => {
    const tempMarkerId = `${CRATE_TEMP_MARKER_PREFIX}abc`;
    const items: CrateLayoutPutItem[] = [
      {
        kind: "marker",
        id: tempMarkerId,
        label: "Deep House",
        parent_id: null,
        accent_key: "amber",
      },
      { kind: "release", instance_id: "111", section_id: tempMarkerId },
      { kind: "release", instance_id: "222", section_id: tempMarkerId },
    ];

    const result = buildCrateLayoutUpdate({
      items,
      crateInstanceIds: new Set(["111", "222"]),
      existingMarkerIds: new Set(),
    });

    if ("error" in result) {
      throw new Error(result.error);
    }

    expect(result.data.markersToUpsert[0]?.id).toBe(tempMarkerId);
    expect(
      result.data.releaseOrders.every((row) => row.section_id === tempMarkerId),
    ).toBe(true);
  });

  it("when releases reference a deleted section id, clears invalid membership", () => {
    const items: CrateLayoutPutItem[] = [
      {
        kind: "marker",
        id: "deep-house",
        label: "Deep House",
        parent_id: null,
        accent_key: null,
      },
      { kind: "release", instance_id: "111", section_id: "gone-marker" },
      { kind: "release", instance_id: "222", section_id: "deep-house" },
    ];

    const result = buildCrateLayoutUpdate({
      items,
      crateInstanceIds: new Set(["111", "222"]),
      existingMarkerIds: new Set(["deep-house"]),
    });

    if ("error" in result) {
      throw new Error(result.error);
    }

    expect(result.data.releaseOrders).toEqual([
      { instance_id: "111", sort_order: 2000, section_id: null },
      { instance_id: "222", sort_order: 3000, section_id: "deep-house" },
    ]);
  });

  it("when the last section marker is removed from the layout payload, accepts the save and clears marker rows", () => {
    const result = buildCrateLayoutUpdate({
      items: [
        { kind: "release", instance_id: "111", section_id: null },
        { kind: "release", instance_id: "222", section_id: null },
        { kind: "release", instance_id: "333", section_id: null },
      ],
      crateInstanceIds,
      existingMarkerIds: new Set(["only-section"]),
    });

    expect(result).toEqual({
      data: {
        releaseOrders: [
          { instance_id: "111", sort_order: 1000, section_id: null },
          { instance_id: "222", sort_order: 2000, section_id: null },
          { instance_id: "333", sort_order: 3000, section_id: null },
        ],
        markersToUpsert: [],
        markerIdsToKeep: [],
      },
    });
  });

  it("when one of two section markers is removed from the payload, keeps the remaining marker", () => {
    const result = buildCrateLayoutUpdate({
      items: [
        {
          kind: "marker",
          id: "early-set",
          label: "Early Set",
          parent_id: null,
          accent_key: null,
        },
        { kind: "release", instance_id: "111", section_id: "early-set" },
        { kind: "release", instance_id: "222", section_id: null },
        { kind: "release", instance_id: "333", section_id: null },
      ],
      crateInstanceIds,
      existingMarkerIds: new Set(["early-set", "deep-house"]),
    });

    expect(result).toMatchObject({
      data: {
        markersToUpsert: [
          {
            id: "early-set",
            label: "Early Set",
            sort_order: 1000,
            parent_id: null,
            accent_key: null,
          },
        ],
        markerIdsToKeep: ["early-set"],
      },
    });
  });

  it("when group delete reparent leaves no markers, the layout save payload is accepted", () => {
    const reparented = reparentCrateLayoutMarkersAfterDelete({
      items: layout.list([
        layout.marker("group", 1000),
        layout.release("111", 2000, "group"),
        layout.release("222", 3000, "group"),
      ]),
      deletedMarkerId: "group",
    });
    const putItems = crateLayoutItemsToPutRequest(
      assignSequentialCrateLayoutSortOrders(reparented),
    );

    const result = buildCrateLayoutUpdate({
      items: putItems,
      crateInstanceIds: new Set(["111", "222"]),
      existingMarkerIds: new Set(["group"]),
    });

    expect(result).toMatchObject({
      data: {
        markersToUpsert: [],
        markerIdsToKeep: [],
        releaseOrders: [
          { instance_id: "111", section_id: null },
          { instance_id: "222", section_id: null },
        ],
      },
    });
  });

  it("when a parent section with a nested subgroup is deleted, the save payload keeps the promoted subgroup marker", () => {
    const reparented = reparentCrateLayoutMarkersAfterDelete({
      items: layout.list([
        layout.marker("parent", 1000),
        layout.marker("nested", 1500, { parent_id: "parent" }),
        layout.release("111", 2000, "nested"),
      ]),
      deletedMarkerId: "parent",
    });
    const putItems = crateLayoutItemsToPutRequest(
      assignSequentialCrateLayoutSortOrders(reparented),
    );

    const result = buildCrateLayoutUpdate({
      items: putItems,
      crateInstanceIds: new Set(["111"]),
      existingMarkerIds: new Set(["parent", "nested"]),
    });

    if ("error" in result) {
      throw new Error(result.error);
    }

    expect(result.data.markersToUpsert).toEqual([
      {
        id: "nested",
        label: expect.any(String),
        sort_order: 1000,
        parent_id: null,
        accent_key: null,
      },
    ]);
    expect(result.data.markerIdsToKeep).toEqual(["nested"]);
    expect(result.data.releaseOrders[0]).toMatchObject({
      instance_id: "111",
      section_id: "nested",
    });
  });

  it("when a child marker appears before its parent, returns an error", () => {
    const result = buildCrateLayoutUpdate({
      items: [
        {
          kind: "marker",
          id: "deep-house",
          label: "Deep House",
          parent_id: "early-set",
        },
        {
          kind: "marker",
          id: "early-set",
          label: "Early Set",
          parent_id: null,
        },
        { kind: "release", instance_id: "111" },
        { kind: "release", instance_id: "222" },
        { kind: "release", instance_id: "333" },
      ],
      crateInstanceIds,
      existingMarkerIds: new Set(["early-set", "deep-house"]),
    });

    expect(result).toEqual({
      error: "Section nesting must follow layout order",
    });
  });
});
