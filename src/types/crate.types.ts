import type { Crate as PrismaCrate } from "@prisma/client";
import type { DiscogsRelease } from "./discogs-release.types";

export type Crate = PrismaCrate;

export type CrateUpdatePayload = Pick<
  Crate,
  "name" | "is_default" | "private" | "packed_enabled"
>;

export type CrateWithCount = Crate & {
  releaseCount?: number;
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
}

export interface CrateWithReleasesResponse {
  crate: Crate;
  releases: CrateReleaseItem[];
  pagination?: PaginationInfo;
}

export interface OptimisticUpdateContext {
  previousCrateData?: CrateWithReleasesResponse | undefined;
  previousCratesData?: CratesResponse | undefined;
}
