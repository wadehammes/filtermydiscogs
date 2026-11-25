import type { NextRequest } from "next/server";
import { SETTINGS_EMAIL_RESEND_NOT_AVAILABLE_MESSAGE } from "src/constants/settingsCopy.constants";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { runContactRouteSideEffect } from "src/lib/contactRouteSideEffects.server";
import { prisma } from "src/lib/db";
import { privateRouteJson } from "src/lib/private-route-response";
import { sendUserEmailVerification } from "src/lib/sendUserEmailVerification.server";
import {
  contactEmailsMatch,
  defaultUserContact,
  mergeUserContactPatch,
  normalizeContactEmail,
  readUserContactFromRow,
  resolveEmailVerificationResendTarget,
  shouldStartEmailVerification,
} from "src/lib/user-contact.server";
import { buildEmailVerificationChallenge } from "src/lib/user-email-verification.server";
import {
  USER_CONTACT_SELECT,
  upsertUserContactRow,
} from "src/lib/userContactPersistence.server";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { userContactPatchSchema } from "src/lib/validation/userContact.schemas";
import { sendWelcomeSignupEmailIfEligible } from "src/lib/welcomeSignupEmail.server";
import type { UserContactPatch } from "src/types/userContact.types";

const enqueueVerificationEmail = (
  siteOrigin: string,
  to: string,
  token: string,
  logMessage: string,
) => {
  runContactRouteSideEffect(
    sendUserEmailVerification({ to, token, siteOrigin }),
    logMessage,
  );
};

const enqueueWelcomeEmailAfterSave = (discogsUserId: number) => {
  runContactRouteSideEffect(
    sendWelcomeSignupEmailIfEligible(discogsUserId),
    "Welcome email after contact save failed:",
  );
};

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
    const patch = parsedBody.data as UserContactPatch;
    const identity = {
      discogsUserId: verified.user.userId,
      username: verified.user.username,
    };

    if (patch.resendEmailVerification === true) {
      const pendingEmail = resolveEmailVerificationResendTarget(current);

      if (pendingEmail == null) {
        return privateRouteJson(
          { error: SETTINGS_EMAIL_RESEND_NOT_AVAILABLE_MESSAGE },
          { status: 400 },
        );
      }

      const { token, tokenHash, expiresAt } = buildEmailVerificationChallenge();

      const updated = await upsertUserContactRow(identity, {
        email: current.email,
        email_pending: pendingEmail,
        email_verified_at: null,
        email_verification_token_hash: tokenHash,
        email_verification_expires_at: expiresAt,
        marketing_emails_opt_in: false,
      });

      enqueueVerificationEmail(
        request.nextUrl.origin,
        pendingEmail,
        token,
        "Verification email resend after contact save failed:",
      );

      return privateRouteJson(readUserContactFromRow(updated));
    }

    const merged = mergeUserContactPatch(current, patch);

    if (merged.error) {
      return privateRouteJson({ error: merged.error }, { status: 400 });
    }

    const normalizedPatchEmail =
      patch.email === undefined
        ? undefined
        : normalizeContactEmail(patch.email);

    if (
      normalizedPatchEmail !== undefined &&
      shouldStartEmailVerification(current, normalizedPatchEmail)
    ) {
      const pendingEmail = normalizedPatchEmail;
      const { token, tokenHash, expiresAt } = buildEmailVerificationChallenge();

      const updated = await upsertUserContactRow(identity, {
        email: current.email,
        email_pending: pendingEmail,
        email_verified_at: null,
        email_verification_token_hash: tokenHash,
        email_verification_expires_at: expiresAt,
        marketing_emails_opt_in: false,
      });

      enqueueVerificationEmail(
        request.nextUrl.origin,
        pendingEmail,
        token,
        "Verification email after contact save failed:",
      );

      return privateRouteJson(readUserContactFromRow(updated));
    }

    if (normalizedPatchEmail !== undefined && normalizedPatchEmail === null) {
      const cleared = await upsertUserContactRow(identity, {
        email: null,
        email_pending: null,
        email_verified_at: null,
        email_verification_token_hash: null,
        email_verification_expires_at: null,
        marketing_emails_opt_in: merged.contact.marketingEmailsOptIn,
      });

      return privateRouteJson(readUserContactFromRow(cleared));
    }

    if (
      normalizedPatchEmail !== undefined &&
      contactEmailsMatch(current.pendingEmail, normalizedPatchEmail) &&
      existing
    ) {
      return privateRouteJson(readUserContactFromRow(existing));
    }

    const updated = await prisma.user.upsert({
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
      select: USER_CONTACT_SELECT,
    });

    enqueueWelcomeEmailAfterSave(verified.user.userId);

    return privateRouteJson(readUserContactFromRow(updated));
  } catch (error) {
    return createErrorResponse(error, { route: "/api/user/contact" });
  }
}
