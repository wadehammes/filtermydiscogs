import type {
  UserTrackRecordBody,
  UserTrackYoutubeOverrideBody,
} from "src/lib/validation/userTrack.schemas";
import type { UserTrackStatCounts } from "src/utils/userTrack";

export type UserTrackStatsResponse = {
  stats: Record<string, UserTrackStatCounts>;
};

export const recordTrackEvent = async (
  body: UserTrackRecordBody,
): Promise<{ ok: true }> => {
  const response = await fetch("/api/tracks/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
};

export const fetchTrackStats = async (
  trackKeys: string[],
): Promise<UserTrackStatsResponse> => {
  const keys = trackKeys.join(",");
  const response = await fetch(
    `/api/tracks/stats?keys=${encodeURIComponent(keys)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<UserTrackStatsResponse>;
};

export const saveTrackYoutubeOverride = async (
  body: UserTrackYoutubeOverrideBody,
): Promise<{ ok: true }> => {
  const response = await fetch("/api/tracks/youtube", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
};
