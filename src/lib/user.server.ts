import { prisma } from "src/lib/db";

type UpsertDiscogsUserInput = {
  discogsUserId: number;
  username: string;
};

export async function upsertDiscogsUser({
  discogsUserId,
  username,
}: UpsertDiscogsUserInput) {
  return prisma.user.upsert({
    where: { discogs_user_id: discogsUserId },
    create: {
      discogs_user_id: discogsUserId,
      username,
    },
    update: {
      username,
    },
  });
}
