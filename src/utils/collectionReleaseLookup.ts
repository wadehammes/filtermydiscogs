import type { DiscogsCollection, DiscogsRelease } from "src/types";
import { getEffectiveCollectionPages } from "src/utils/collectionPagination";

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
