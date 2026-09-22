import type { DiscogsRelease } from "src/types";
import type {
  CrateLayoutItem,
  CrateLayoutPutRequest,
  CrateUpdatePayload,
  CrateWithCount,
} from "src/types/crate.types";

export interface CrateState {
  crates: CrateWithCount[];
  activeCrateId: string | null;
  activeCrateInstanceIds: ReadonlySet<string>;
  selectedReleases: DiscogsRelease[];
  layoutItems: CrateLayoutItem[];
  isLoading: boolean;
  isPendingCrate: boolean;
  isLoadingCrate: boolean;
  isFetchingCrate: boolean;
  isDrawerOpen: boolean;
  packedReleaseCount: number;
  isUpdatingCrate: boolean;
  isUpdatingCrateLayout: boolean;
  isCreatingCrate: boolean;
  isDeletingCrate: boolean;
}

export interface CrateActions {
  addToCrate: (release: DiscogsRelease) => void;
  addReleaseToCrate: (
    crateId: string,
    release: DiscogsRelease,
    options?: { openDrawer?: boolean },
  ) => void;
  removeFromCrate: (releaseId: string) => void;
  removeReleaseFromCrate: (crateId: string, releaseId: string) => void;
  setReleaseCrateMembership: (
    crateIds: string[],
    release: DiscogsRelease,
    options?: { openDrawer?: boolean },
  ) => void;
  isInCrate: (releaseId: string) => boolean;
  isPacked: (releaseId: string) => boolean;
  setPacked: (releaseId: string, packed: boolean) => void;
  clearAllPacked: () => void;
  clearCrate: () => void;
  createCrate: (
    name: string,
    options?: { setAsDefault?: boolean },
  ) => Promise<string | null>;
  selectCrate: (crateId: string) => void;
  updateCrate: (
    crateId: string,
    updates: Partial<CrateUpdatePayload>,
  ) => Promise<void>;
  deleteCrate: (crateId: string) => Promise<void>;
  updateCrateLayout: (
    crateId: string,
    params: {
      layout: CrateLayoutPutRequest;
      optimisticLayoutItems: CrateLayoutItem[];
    },
  ) => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export type CrateContextType = CrateState & CrateActions;
