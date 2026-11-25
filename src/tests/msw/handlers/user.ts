import { HttpResponse, http } from "msw";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import type {
  UserContact,
  UserContactPatch,
} from "src/types/userContact.types";
import type { UserPreferences } from "src/types/userPreferences.types";
import {
  contactEmailsMatch,
  defaultUserContact,
  mergeUserContactPatch,
  normalizeContactEmail,
  resolveEmailVerificationResendTarget,
  shouldStartEmailVerification,
} from "src/utils/userContact.helpers";

export function createDefaultUserApiHandlers() {
  let preferences: UserPreferences = userPreferencesFactory.defaults();
  let contact: UserContact = {
    ...defaultUserContact(),
    email: "dig@example.com",
    emailVerified: true,
  };

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

      if (body.resendEmailVerification === true) {
        const target = resolveEmailVerificationResendTarget(contact);

        if (target == null) {
          return HttpResponse.json(
            { error: "No email address is waiting for verification." },
            { status: 400 },
          );
        }

        contact = {
          ...contact,
          pendingEmail: target,
          emailVerified: false,
        };

        return HttpResponse.json(contact);
      }

      const merged = mergeUserContactPatch(contact, body);

      if (merged.error) {
        return HttpResponse.json({ error: merged.error }, { status: 400 });
      }

      const normalizedEmail = normalizeContactEmail(body.email);

      if (
        normalizedEmail !== undefined &&
        shouldStartEmailVerification(contact, normalizedEmail)
      ) {
        contact = {
          ...contact,
          pendingEmail: normalizedEmail,
          marketingEmailsOptIn: false,
        };

        return HttpResponse.json(contact);
      }

      if (normalizedEmail === null) {
        contact = defaultUserContact();
        return HttpResponse.json(contact);
      }

      if (
        normalizedEmail !== undefined &&
        contactEmailsMatch(normalizedEmail, merged.contact.email)
      ) {
        contact = merged.contact;
        return HttpResponse.json(contact);
      }

      if (body.marketingEmailsOptIn !== undefined) {
        contact = {
          ...contact,
          marketingEmailsOptIn: merged.contact.marketingEmailsOptIn,
        };
      }

      return HttpResponse.json(contact);
    }),
  ];
}
