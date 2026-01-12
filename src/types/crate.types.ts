import type { Crate as PrismaCrate } from "@prisma/client";
import type { DiscogsRelease } from "./index";

export type Crate = PrismaCrate;

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

export interface CrateWithReleasesResponse {
  crate: Crate;
  releases: DiscogsRelease[];
  pagination?: PaginationInfo;
}

export interface OptimisticUpdateContext {
  previousCrateData?: CrateWithReleasesResponse | undefined;
  previousCratesData?: CratesResponse | undefined;
}
