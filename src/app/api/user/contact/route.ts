import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import {
  defaultUserContact,
  mergeUserContactPatch,
  readUserContactFromRow,
} from "src/lib/user-contact.server";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { userContactPatchSchema } from "src/lib/validation/userContact.schemas";
import type { UserContactPatch } from "src/types/userContact.types";

const USER_CONTACT_SELECT = {
  email: true,
  marketing_emails_opt_in: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(request);
    if ("error" in verified) {
      return verified.error;
    }

    const user = await prisma.user.findUnique({
      where: { discogs_user_id: verified.user.userId },
      select: USER_CONTACT_SELECT,
    });

    const contact = user ? readUserContactFromRow(user) : defaultUserContact();

    return privateRouteJson(contact);
  } catch (error) {
    return createErrorResponse(error, { route: "/api/user/contact" });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }

    const parsedBody = await parseRequestBody(request, userContactPatchSchema, {
      invalidJsonMessage: "Invalid JSON body",
    });
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { discogs_user_id: verified.user.userId },
      select: USER_CONTACT_SELECT,
    });

    const current = existing
      ? readUserContactFromRow(existing)
      : defaultUserContact();
    const merged = mergeUserContactPatch(
      current,
      parsedBody.data as UserContactPatch,
    );

    if (merged.error) {
      return privateRouteJson({ error: merged.error }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { discogs_user_id: verified.user.userId },
      create: {
        discogs_user_id: verified.user.userId,
        username: verified.user.username,
        email: merged.contact.email,
        marketing_emails_opt_in: merged.contact.marketingEmailsOptIn,
      },
      update: {
        username: verified.user.username,
        email: merged.contact.email,
        marketing_emails_opt_in: merged.contact.marketingEmailsOptIn,
      },
    });

    return privateRouteJson(merged.contact);
  } catch (error) {
    return createErrorResponse(error, { route: "/api/user/contact" });
  }
}
