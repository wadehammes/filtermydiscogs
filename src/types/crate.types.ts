import type { Crate as PrismaCrate } from "@prisma/client";
import type { DiscogsRelease } from "./discogs-release.types";

export type Crate = PrismaCrate;

export type CrateUpdatePayload = Pick<
  Crate,
  "name" | "is_default" | "private" | "packed_enabled" | "notes"
>;

export type CrateWithCount = Crate & {
  releaseCount?: number;
  previewThumbs?: string[];
};

export interface CratesResponse {
  crates: CrateWithCount[];
}

export interface ReleaseCrateMembershipResponse {
  crateIds: string[];
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CrateReleaseItem {
  release: DiscogsRelease;
  found_at: string | null;
  sort_order: number;
  section_id?: string | null;
}

export interface CrateSetMarker {
  id: string;
  label: string;
  sort_order: number;
  parent_id?: string | null;
  accent_key?: string | null;
}

export interface CrateLayoutReleaseItem {
  kind: "release";
  instance_id: string;
  sort_order: number;
  release: DiscogsRelease;
  found_at: string | null;
  section_id: string | null;
}

export interface CrateLayoutMarkerItem {
  kind: "marker";
  id: string;
  label: string;
  sort_order: number;
  parent_id: string | null;
  accent_key: string | null;
}

export type CrateLayoutItem = CrateLayoutReleaseItem | CrateLayoutMarkerItem;

export type CrateLayoutPutMarkerFields = {
  parent_id?: string | null;
  accent_key?: string | null;
};

export type CrateLayoutPutMarkerItem =
  | ({ kind: "marker"; id: string; label: string } & CrateLayoutPutMarkerFields)
  | ({ kind: "marker"; label: string } & CrateLayoutPutMarkerFields);

export type CrateLayoutPutReleaseItem = {
  kind: "release";
  instance_id: string;
  section_id?: string | null;
};

export type CrateLayoutPutItem =
  | CrateLayoutPutMarkerItem
  | CrateLayoutPutReleaseItem;

export interface CrateLayoutPutRequest {
  items: CrateLayoutPutItem[];
}

export interface CrateWithReleasesResponse {
  crate: Crate;
  releases: CrateReleaseItem[];
  markers: CrateSetMarker[];
  pagination?: PaginationInfo;
}

export interface OptimisticUpdateContext {
  previousCrateData?: CrateWithReleasesResponse | undefined;
  previousCratesData?: CratesResponse | undefined;
}
