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

const collectionReleaseBasicInformationSignature = (
  release: DiscogsRelease,
): string => JSON.stringify(release.basic_information);

export const mergeLiveCollectionPageBasicInformationIntoPages = (
  cachedPages: DiscogsCollection[],
  livePage: DiscogsCollection,
): { pages: DiscogsCollection[]; updated: boolean } => {
  const liveByInstance = buildReleaseIndexFromList(livePage.releases);
  const cachedByInstance = buildCollectionReleaseIndex(cachedPages);

  for (const live of livePage.releases) {
    const cached = cachedByInstance.get(String(live.instance_id));
    if (!cached) {
      continue;
    }

    if (
      collectionReleaseBasicInformationSignature(cached) !==
      collectionReleaseBasicInformationSignature(live)
    ) {
      const pages = cachedPages.map((page) => ({
        ...page,
        releases: page.releases.map((release) => {
          const liveRelease = liveByInstance.get(String(release.instance_id));
          if (!liveRelease) {
            return release;
          }

          if (
            collectionReleaseBasicInformationSignature(release) ===
            collectionReleaseBasicInformationSignature(liveRelease)
          ) {
            return release;
          }

          return {
            ...release,
            basic_information: liveRelease.basic_information,
          };
        }),
      }));

      return { pages, updated: true };
    }
  }

  return { pages: cachedPages, updated: false };
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
