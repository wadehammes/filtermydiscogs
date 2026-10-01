import { HttpResponse, http } from "msw";
import { userTrackStatsResponseFactory } from "src/tests/factories/UserTrackStatsResponse.factory";

export function createDefaultTrackApiHandlers() {
  return [
    http.get("/api/tracks/stats", () =>
      HttpResponse.json(userTrackStatsResponseFactory.build()),
    ),
    http.post("/api/tracks/record", () => HttpResponse.json({ ok: true })),
  ];
}
