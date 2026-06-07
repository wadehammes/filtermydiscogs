export const DiscogsCollectionQueryKeys = {
  all: () => ["discogsCollection"] as const,
  byUsername: (username: string) =>
    [...DiscogsCollectionQueryKeys.all(), username] as const,
};

export const CollectionFieldsQueryKeys = {
  all: () => ["collectionFields"] as const,
  byUsername: (username: string) =>
    [...CollectionFieldsQueryKeys.all(), username] as const,
};

export const CollectionValueQueryKeys = {
  byUsername: (username: string | null) =>
    ["collectionValue", username] as const,
};

export const DiscogsReleaseQueryKeys = {
  byId: (releaseId: string) => ["discogsRelease", releaseId] as const,
};

export const CratesQueryKeys = {
  all: () => ["crates"] as const,
  byUserId: (userId: string | number | null) =>
    [...CratesQueryKeys.all(), userId] as const,
};

export const CrateQueryKeys = {
  all: () => ["crate"] as const,
  byUserId: (userId: string | number | null) =>
    [...CrateQueryKeys.all(), userId] as const,
  byUserAndId: (userId: string | number | null, crateId: string | null) =>
    [...CrateQueryKeys.byUserId(userId), crateId] as const,
};

export const PublicCrateQueryKeys = {
  byId: (crateId: string | null) => ["publicCrate", crateId] as const,
};

export const MostCratedQueryKeys = {
  list: (limit: number) => ["mostCrated", limit] as const,
};

export const AdminStatsQueryKeys = {
  all: () => ["adminStats"] as const,
};
