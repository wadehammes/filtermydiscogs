export type VercelFlagEntities = {
  user?: {
    id: string;
    discogsUserId: string;
    username: string;
  };
};

export const buildVercelFlagEntitiesFromDiscogsCookies = (
  userId: string | undefined,
  username: string | undefined,
): VercelFlagEntities => {
  if (!(userId && username)) {
    return {};
  }

  return {
    user: {
      id: userId,
      discogsUserId: userId,
      username: username.toLowerCase(),
    },
  };
};
