import type { UserTrackRecordBody } from "src/lib/validation/userTrack.schemas";

export type UserTrackStatsResponse = {
  stats: Record<string, { play_count: number; listen_count: number }>;
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
