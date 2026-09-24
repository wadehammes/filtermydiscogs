import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  CrateLayoutItem,
  CrateLayoutMarkerItem,
  CrateLayoutReleaseItem,
} from "src/types/crate.types";

export const crateLayoutMarkerItemFactory = {
  build(
    id: string,
    sortOrder: number,
    attributes: Partial<CrateLayoutMarkerItem> = {},
  ): CrateLayoutMarkerItem {
    return {
      kind: "marker",
      id,
      label: id,
      sort_order: sortOrder,
      parent_id: null,
      accent_key: null,
      ...attributes,
    };
  },
};

export const crateLayoutReleaseItemFactory = {
  build(
    instanceId: string,
    sortOrder: number,
    sectionId: string | null = null,
    attributes: Partial<Omit<CrateLayoutReleaseItem, "kind">> = {},
  ): CrateLayoutReleaseItem {
    return {
      kind: "release",
      instance_id: instanceId,
      sort_order: sortOrder,
      section_id: sectionId,
      release: releaseFactory.build({ instance_id: instanceId }),
      found_at: null,
      ...attributes,
    };
  },
};

export const crateLayoutItemFactory = {
  marker: crateLayoutMarkerItemFactory.build,
  release: crateLayoutReleaseItemFactory.build,
  list(items: CrateLayoutItem[]): CrateLayoutItem[] {
    return items;
  },
};
