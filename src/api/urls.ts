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
import { interpretCollectionCommand } from "src/api/endpoints/collectionCommand";
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
  fetchAdminWelcomeEmailPending,
  fetchMostCratedReleases,
  fetchTopUserTracks,
  sendAdminWelcomeEmail,
} from "src/api/endpoints/dashboard";
import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  fetchPlaylist,
  fetchPlaylists,
  fetchPublicPlaylist,
  recordPublicPlaylistPlay,
  recordPublicPlaylistView,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  updatePlaylist,
  votePublicPlaylistTrack,
} from "src/api/endpoints/playlists";
import {
  fetchDiscogsRelease,
  fetchDiscogsReleaseBatch,
  fetchDiscogsSearch,
} from "src/api/endpoints/release";
import {
  fetchTrackStats,
  recordTrackEvent,
  saveTrackYoutubeOverride,
} from "src/api/endpoints/tracks";
import {
  fetchUserContact,
  updateUserContact,
} from "src/api/endpoints/userContact";
import {
  fetchUserPreferences,
  updateUserPreferences,
} from "src/api/endpoints/userPreferences";
import { dismissSupportProjectToast } from "src/api/endpoints/userSupportToast";
import { fetchYoutubeOembed } from "src/api/endpoints/youtube";

export const api = {
  addReleaseToCrate,
  adminStats: fetchAdminStats,
  adminUserLookup: fetchAdminUserLookup,
  adminWelcomeEmailPending: fetchAdminWelcomeEmailPending,
  sendAdminWelcomeEmail,
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
  topUserTracks: fetchTopUserTracks,
  migrateLegacyCrate,
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  playlist: fetchPlaylist,
  playlists: fetchPlaylists,
  publicCrate: fetchPublicCrate,
  publicPlaylist: fetchPublicPlaylist,
  recordPublicPlaylistPlay,
  recordPublicPlaylistView,
  votePublicPlaylistTrack,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  releaseCrateMembership: fetchReleaseCrateMembership,
  removeReleaseFromCrate,
  setReleaseCrateMembership,
  setReleasePackedInCrate,
  syncCrates,
  recordTrackEvent,
  fetchTrackStats,
  fetchYoutubeOembed,
  interpretCollectionCommand,
  saveTrackYoutubeOverride,
  updateCollectionNote,
  updateCrate,
  updateCrateLayout,
  updatePlaylist,
  updateReleaseRating,
  updateUserContact,
  updateUserPreferences,
  userContact: fetchUserContact,
  userPreferences: fetchUserPreferences,
};

export type Api = typeof api;
