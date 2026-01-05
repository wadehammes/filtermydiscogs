import type { Crate as PrismaCrate } from "@prisma/client";
import type { DiscogsRelease } from "./index";

export type Crate = PrismaCrate;

export type CrateWithCount = Crate & {
  releaseCount?: number;
};

export interface CratesResponse {
  crates: CrateWithCount[];
}

export interface CrateWithReleasesResponse {
  crate: Crate;
  releases: DiscogsRelease[];
}

export interface OptimisticUpdateContext {
  previousCrateData?: CrateWithReleasesResponse | undefined;
  previousCratesData?: CratesResponse | undefined;
}
