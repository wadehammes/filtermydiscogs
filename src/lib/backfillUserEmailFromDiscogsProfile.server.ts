import "server-only";

import { prisma } from "src/lib/db";
import type { DiscogsProfileEmailCredentials } from "src/lib/discogs-profile-email.server";
import { fetchDiscogsProfileEmailForLogin } from "src/lib/discogs-profile-email.server";

export const backfillUserEmailFromDiscogsProfileIfEmpty = async (
  discogsUserId: number,
  credentials: DiscogsProfileEmailCredentials,
  routeLabel: string,
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { discogs_user_id: discogsUserId },
    select: { email: true },
  });

  if ((user?.email?.trim() ?? "") !== "") {
    return;
  }

  const email = await fetchDiscogsProfileEmailForLogin(credentials, routeLabel);

  if (!email) {
    return;
  }

  await prisma.user.update({
    where: { discogs_user_id: discogsUserId },
    data: { email },
  });
};
