import { HttpResponse, http } from "msw";
import {
  defaultUserContact,
  mergeUserContactPatch,
} from "src/lib/user-contact.server";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import type {
  UserContact,
  UserContactPatch,
} from "src/types/userContact.types";
import type { UserPreferences } from "src/types/userPreferences.types";

export function createDefaultUserApiHandlers() {
  let preferences: UserPreferences = userPreferencesFactory.defaults();
  let contact: UserContact = defaultUserContact();

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
    http.get("/api/user/contact", () => HttpResponse.json(contact)),
    http.patch("/api/user/contact", async ({ request }) => {
      const body = (await request.json()) as UserContactPatch;
      const merged = mergeUserContactPatch(contact, body);

      if (merged.error) {
        return HttpResponse.json({ error: merged.error }, { status: 400 });
      }

      contact = merged.contact;

      return HttpResponse.json(contact);
    }),
  ];
}
