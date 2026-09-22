import { HttpResponse, http } from "msw";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";

export function createDefaultUserApiHandlers() {
  return [
    http.get("/api/user/preferences", () =>
      HttpResponse.json(userPreferencesFactory.defaultsApiResponse()),
    ),
    http.patch("/api/user/preferences", () =>
      HttpResponse.json(userPreferencesFactory.defaultsApiResponse()),
    ),
  ];
}
