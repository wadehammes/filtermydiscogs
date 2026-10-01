import { HttpResponse, http } from "msw";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import type { UserPreferences } from "src/types/userPreferences.types";

export function createDefaultUserApiHandlers() {
  let preferences: UserPreferences = userPreferencesFactory.defaults();

  const responseBody = () => ({ preferences });

  return [
    http.get("/api/user/preferences", () => HttpResponse.json(responseBody())),
    http.patch("/api/user/preferences", async ({ request }) => {
      const body = (await request.json()) as Partial<UserPreferences>;
      preferences = userPreferencesFactory.build({
        ...preferences,
        ...body,
      });

      return HttpResponse.json(responseBody());
    }),
  ];
}
