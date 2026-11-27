import type { DiscogsRelease } from "src/types";

const isReleaseAlreadyInCrateError = (error: unknown): boolean =>
  error instanceof Error && error.message.includes("409");

export const addCollectionCommandReleasesToCrate = async ({
  crateId,
  releases,
  addReleaseToCrate,
}: {
  crateId: string;
  releases: readonly DiscogsRelease[];
  addReleaseToCrate: (
    crateId: string,
    release: DiscogsRelease,
  ) => Promise<unknown>;
}): Promise<number> => {
  let addedCount = 0;

  for (const release of releases) {
    try {
      await addReleaseToCrate(crateId, release);
      addedCount += 1;
    } catch (error) {
      if (!isReleaseAlreadyInCrateError(error)) {
        throw error;
      }
    }
  }

  return addedCount;
};
