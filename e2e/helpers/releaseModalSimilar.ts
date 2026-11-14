import type { NetworkFixture } from "@msw/playwright";
import { buildE2eSimilarModalShuffleCollectionReleases } from "src/tests/msw/e2eCollectionData";
import { createE2eCollectionPageHandler } from "src/tests/msw/e2eCollectionHandlers";
import { createE2eReleaseByIdHandler } from "src/tests/msw/e2eReleaseHandlers";

export const stubE2eCollectionForSimilarModalShuffle = (
  network: NetworkFixture,
) => {
  const releases = buildE2eSimilarModalShuffleCollectionReleases();

  return network.use(
    createE2eCollectionPageHandler(releases),
    createE2eReleaseByIdHandler(),
  );
};
