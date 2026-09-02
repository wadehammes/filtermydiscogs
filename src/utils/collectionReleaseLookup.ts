import type { DiscogsCollection, DiscogsRelease } from "src/types";
import { getEffectiveCollectionPages } from "src/utils/collectionPagination";

export const buildReleaseIndexFromList = (
  releases: DiscogsRelease[],
): Map<string, DiscogsRelease> => {
  const index = new Map<string, DiscogsRelease>();

  for (const release of releases) {
    index.set(String(release.instance_id), release);
  }

  return index;
};

export const buildCollectionReleaseIndex = (
  pages: DiscogsCollection[],
): Map<string, DiscogsRelease> => {
  const releases = getEffectiveCollectionPages({ pages }).flatMap(
    (page) => page.releases,
  );

  return buildReleaseIndexFromList(
    releases.map((release) => ({
      ...release,
      notes: release.notes ?? [],
    })),
  );
};

export const findCollectionReleaseByInstanceId = (
  pages: DiscogsCollection[],
  instanceId: string,
): DiscogsRelease | null => {
  const normalizedInstanceId = String(instanceId);

  for (const release of getEffectiveCollectionPages({ pages }).flatMap(
    (page) => page.releases,
  )) {
    if (String(release.instance_id) === normalizedInstanceId) {
      return {
        ...release,
        notes: release.notes ?? [],
      };
    }
  }

  return null;
};

export const patchCollectionPagesReleaseByInstanceId = (
  pages: DiscogsCollection[],
  instanceId: string,
  patch: Partial<DiscogsRelease>,
): DiscogsCollection[] => {
  const normalizedInstanceId = String(instanceId);

  return pages.map((page) => ({
    ...page,
    releases: page.releases.map((release) =>
      String(release.instance_id) === normalizedInstanceId
        ? { ...release, ...patch }
        : release,
    ),
  }));
};
