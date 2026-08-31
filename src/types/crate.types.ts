import type { DiscogsRelease } from "./discogs-release.types";

export type Crate = {
  user_id: number;
  id: string;
  name: string;
  username: string | null;
  is_default: boolean;
  private: boolean;
  packed_enabled: boolean;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

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
}

export interface CrateSetMarker {
  id: string;
  label: string;
  sort_order: number;
}

export interface CrateLayoutReleaseItem {
  kind: "release";
  instance_id: string;
  sort_order: number;
  release: DiscogsRelease;
  found_at: string | null;
}

export interface CrateLayoutMarkerItem {
  kind: "marker";
  id: string;
  label: string;
  sort_order: number;
}

export type CrateLayoutItem = CrateLayoutReleaseItem | CrateLayoutMarkerItem;

export type CrateLayoutPutMarkerItem =
  | { kind: "marker"; id: string; label: string }
  | { kind: "marker"; label: string };

export type CrateLayoutPutReleaseItem = {
  kind: "release";
  instance_id: string;
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
