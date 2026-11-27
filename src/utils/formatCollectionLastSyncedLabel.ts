const MS_MINUTE = 60_000;
const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;

const formatSyncedCalendarDate = (syncedAtMs: number): string =>
  new Date(syncedAtMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const formatCollectionSyncingLabel = (): string =>
  "Syncing collection with Discogs…";

export const resolveCollectionLastSyncedLabel = ({
  dataUpdatedAt,
  fetchingCollection,
  nowMs = Date.now(),
}: {
  dataUpdatedAt: number | null;
  fetchingCollection: boolean;
  nowMs?: number;
}): string | null => {
  if (fetchingCollection) {
    return formatCollectionSyncingLabel();
  }

  if (dataUpdatedAt === null || dataUpdatedAt === 0) {
    return null;
  }

  return formatCollectionLastSyncedLabel(dataUpdatedAt, nowMs);
};

export const formatCollectionLastSyncedLabel = (
  syncedAtMs: number,
  nowMs = Date.now(),
): string => {
  const ageMs = Math.max(0, nowMs - syncedAtMs);

  if (ageMs < MS_MINUTE) {
    return "Collection synced just now";
  }

  if (ageMs < MS_HOUR) {
    const minutes = Math.floor(ageMs / MS_MINUTE);
    return `Collection synced ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  if (ageMs < MS_DAY) {
    const hours = Math.floor(ageMs / MS_HOUR);
    return `Collection synced ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  return `Collection synced on ${formatSyncedCalendarDate(syncedAtMs)}`;
};
