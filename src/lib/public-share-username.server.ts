import { prisma } from "src/lib/db";

export const resolvePublicShareUsername = async (
  ownerUserId: number,
  storedUsername: string | null | undefined,
): Promise<string | null> => {
  const trimmedStored = storedUsername?.trim() ?? "";

  if (trimmedStored) {
    return trimmedStored;
  }

  const owner = await prisma.user.findUnique({
    where: { discogs_user_id: ownerUserId },
    select: { username: true },
  });

  const trimmedOwner = owner?.username?.trim() ?? "";

  return trimmedOwner || null;
};
