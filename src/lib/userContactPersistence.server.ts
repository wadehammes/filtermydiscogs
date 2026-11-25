import "server-only";

import { prisma } from "src/lib/db";
import type { UserContactDbRow } from "src/types/userContact.types";

export const USER_CONTACT_SELECT = {
  email: true,
  email_verified_at: true,
  email_pending: true,
  marketing_emails_opt_in: true,
} as const;

export type UserContactRowWrite = {
  email: string | null;
  email_pending: string | null;
  email_verified_at: Date | null;
  email_verification_token_hash: string | null;
  email_verification_expires_at: Date | null;
  marketing_emails_opt_in: boolean;
};

export const upsertUserContactRow = async (
  identity: { discogsUserId: number; username: string },
  row: UserContactRowWrite,
): Promise<UserContactDbRow> => {
  return prisma.user.upsert({
    where: { discogs_user_id: identity.discogsUserId },
    create: {
      discogs_user_id: identity.discogsUserId,
      username: identity.username,
      ...row,
    },
    update: {
      username: identity.username,
      ...row,
    },
    select: USER_CONTACT_SELECT,
  });
};
