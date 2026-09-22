import { HttpResponse, http } from "msw";
import {
  buildE2eDashboardMostCrated,
  buildE2eDashboardTopTracks,
} from "src/tests/msw/e2eDashboardData";
import type { DiscogsRelease } from "src/types";

export function createDefaultDashboardApiHandlers(options?: {
  releases?: DiscogsRelease[];
}) {
  const releases = options?.releases ?? [];
  const mostCrated = buildE2eDashboardMostCrated(releases);
  const topTracks = buildE2eDashboardTopTracks(releases);

  return [
    http.get("/api/dashboard/most-crated", () =>
      HttpResponse.json({ releases: mostCrated }),
    ),
    http.get("/api/dashboard/top-tracks", () => HttpResponse.json(topTracks)),
  ];
}
