import { trackEvent } from "src/analytics/analytics";

const trackProductEvent = (
  event: string,
  {
    category,
    label,
    value,
  }: {
    category: string;
    label: string;
    value: string;
  },
) => {
  trackEvent(event, {
    category,
    action: event,
    label,
    value,
  });
};

export const trackCrateReleaseAdded = (instanceId: string | number) => {
  trackProductEvent("crateReleaseAdded", {
    category: "crate",
    label: "Add release to crate",
    value: String(instanceId),
  });
};

export const trackCrateReleaseRemoved = (instanceId: string | number) => {
  trackProductEvent("crateReleaseRemoved", {
    category: "crate",
    label: "Remove release from crate",
    value: String(instanceId),
  });
};

export const trackCrateCreated = (crateId: string) => {
  trackProductEvent("crateCreated", {
    category: "crate",
    label: "Create crate",
    value: crateId,
  });
};

export const trackCrateDeleted = (crateId: string) => {
  trackProductEvent("crateDeleted", {
    category: "crate",
    label: "Delete crate",
    value: crateId,
  });
};

export const trackCrateVisibilityChanged = (
  crateId: string,
  isPublic: boolean,
) => {
  trackProductEvent("crateVisibilityChanged", {
    category: "crate",
    label: isPublic ? "Public crate" : "Private crate",
    value: crateId,
  });
};

export const trackCratePackingEnabled = (crateId: string, enabled: boolean) => {
  trackProductEvent("cratePackingEnabled", {
    category: "crate",
    label: enabled ? "Gig packing enabled" : "Gig packing disabled",
    value: crateId,
  });
};

export const trackReleasePacked = (
  instanceId: string | number,
  packed: boolean,
) => {
  trackProductEvent(packed ? "releasePacked" : "releaseUnpacked", {
    category: "crate",
    label: packed ? "Mark release packed" : "Unmark release packed",
    value: String(instanceId),
  });
};

export const trackCrateNotesSaved = (crateId: string) => {
  trackProductEvent("crateNotesSaved", {
    category: "crate",
    label: "Save crate notes",
    value: crateId,
  });
};

export const trackCrateLayoutUpdated = (crateId: string) => {
  trackProductEvent("crateLayoutUpdated", {
    category: "crate",
    label: "Update crate layout",
    value: crateId,
  });
};

export const trackCrateCleared = (releaseCount: number) => {
  trackProductEvent("crateCleared", {
    category: "crate",
    label: "Clear crate releases",
    value: String(releaseCount),
  });
};

export const trackCratePackedCleared = (crateId: string) => {
  trackProductEvent("cratePackedCleared", {
    category: "crate",
    label: "Clear packed releases",
    value: crateId,
  });
};

export const trackPlaybackStarted = (instanceId: string | number) => {
  trackProductEvent("playbackStarted", {
    category: "playback",
    label: "Start playback",
    value: String(instanceId),
  });
};

export const trackPlaybackQueued = (instanceId: string | number) => {
  trackProductEvent("playbackQueued", {
    category: "playback",
    label: "Add to playback queue",
    value: String(instanceId),
  });
};

export const trackPlaybackVideoOpened = () => {
  trackProductEvent("playbackVideoOpened", {
    category: "playback",
    label: "Open playback video panel",
    value: "true",
  });
};

export const trackLoginStarted = () => {
  trackProductEvent("loginStarted", {
    category: "auth",
    label: "Start Discogs login",
    value: "discogs",
  });
};

export const trackLoginCompleted = (userId: string) => {
  trackProductEvent("loginCompleted", {
    category: "auth",
    label: "Complete Discogs login",
    value: userId,
  });
};

export const trackAnalyticsConsentGranted = () => {
  trackProductEvent("analyticsConsentGranted", {
    category: "consent",
    label: "Accept analytics cookies",
    value: "granted",
  });
};

export const trackUserDataCleared = () => {
  trackProductEvent("userDataCleared", {
    category: "account",
    label: "Clear stored data",
    value: "true",
  });
};

export const trackReleaseNoteSaved = (instanceId: string | number) => {
  trackProductEvent("releaseNoteSaved", {
    category: "collection",
    label: "Save release note",
    value: String(instanceId),
  });
};

export const trackReleaseRatingSaved = (instanceId: string | number) => {
  trackProductEvent("releaseRatingSaved", {
    category: "collection",
    label: "Save release rating",
    value: String(instanceId),
  });
};

export const trackViewModeChanged = (view: string) => {
  trackProductEvent("viewModeChanged", {
    category: "collection",
    label: `View: ${view}`,
    value: view,
  });
};

export const trackFilterViewSaved = (viewName: string, totalViews: number) => {
  trackProductEvent("filterViewSaved", {
    category: "filters",
    label: viewName,
    value: String(totalViews),
  });
};

export const trackCrateSyncManual = (removedCount: number) => {
  trackProductEvent("crateSync", {
    category: "crate",
    label: "Manual crate sync",
    value: String(removedCount),
  });
};

export const trackMosaicDownload = (releaseCount: number) => {
  trackProductEvent("mosaicDownload", {
    category: "mosaic",
    label: "Download mosaic",
    value: String(releaseCount),
  });
};

export const trackMosaicError = (errorMessage: string) => {
  trackProductEvent("mosaicError", {
    category: "mosaic",
    label: "Generation failed",
    value: errorMessage,
  });
};

export const trackPageView = (pathname: string, label: string) => {
  trackProductEvent("pageView", {
    category: "navigation",
    label,
    value: pathname,
  });
};
