import { checkAuth, clearData, logout } from "src/api/endpoints/auth";
import { fetchBuildVersion } from "src/api/endpoints/buildVersion";
import {
  clearReleaseRating,
  fetchCollectionFields,
  fetchCollectionValue,
  fetchDiscogsCollection,
  updateCollectionNote,
  updateReleaseRating,
} from "src/api/endpoints/collection";
import {
  addReleaseToCrate,
  clearAllPackedInCrate,
  createCrate,
  deleteCrate,
  fetchCrate,
  fetchCrates,
  fetchPublicCrate,
  fetchReleaseCrateMembership,
  migrateLegacyCrate,
  removeReleaseFromCrate,
  setReleaseCrateMembership,
  setReleasePackedInCrate,
  syncCrates,
  updateCrate,
  updateCrateLayout,
} from "src/api/endpoints/crates";
import {
  fetchAdminStats,
  fetchAdminUserLookup,
  fetchMostCratedReleases,
} from "src/api/endpoints/dashboard";
import {
  fetchDiscogsRelease,
  fetchDiscogsReleaseBatch,
  fetchDiscogsSearch,
} from "src/api/endpoints/release";
import {
  fetchUserPreferences,
  updateUserPreferences,
} from "src/api/endpoints/userPreferences";
import { dismissSupportProjectToast } from "src/api/endpoints/userSupportToast";

export const api = {
  addReleaseToCrate,
  adminStats: fetchAdminStats,
  adminUserLookup: fetchAdminUserLookup,
  buildVersion: fetchBuildVersion,
  checkAuth,
  clearAllPackedInCrate,
  clearData,
  clearReleaseRating,
  collectionFields: fetchCollectionFields,
  collectionValue: fetchCollectionValue,
  createCrate,
  crate: fetchCrate,
  crates: fetchCrates,
  deleteCrate,
  discogsCollection: fetchDiscogsCollection,
  discogsRelease: fetchDiscogsRelease,
  discogsReleaseBatch: fetchDiscogsReleaseBatch,
  discogsSearch: fetchDiscogsSearch,
  dismissSupportProjectToast,
  logout,
  mostCratedReleases: fetchMostCratedReleases,
  migrateLegacyCrate,
  publicCrate: fetchPublicCrate,
  releaseCrateMembership: fetchReleaseCrateMembership,
  removeReleaseFromCrate,
  setReleaseCrateMembership,
  setReleasePackedInCrate,
  syncCrates,
  updateCollectionNote,
  updateCrate,
  updateCrateLayout,
  updateReleaseRating,
  updateUserPreferences,
  userPreferences: fetchUserPreferences,
};

export type Api = typeof api;
