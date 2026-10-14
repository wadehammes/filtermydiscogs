import { HttpResponse, http } from "msw";

export function createDefaultUsageApiHandlers() {
  return [
    http.post("/api/usage/events", async () => HttpResponse.json({ ok: true })),
  ];
}
