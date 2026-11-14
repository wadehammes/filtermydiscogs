import { useCallback, useState } from "react";
import { SIMILAR_PAGE_INDEX_SESSION_KEY } from "src/constants/storageKeys";

type SimilarReleasesPageState = {
  anchorKey: string;
  collectionCount: number;
  index: number;
};

const similarPageIndexByAnchor = new Map<string, number>();

const readSimilarPageIndexSessionStore = (): Record<string, number> => {
  if (typeof sessionStorage === "undefined") {
    return {};
  }

  const sessionJson = sessionStorage.getItem(SIMILAR_PAGE_INDEX_SESSION_KEY);

  if (!sessionJson) {
    return {};
  }

  try {
    const sessionStore: unknown = JSON.parse(sessionJson);

    if (!sessionStore || typeof sessionStore !== "object") {
      return {};
    }

    return Object.fromEntries(
      Object.entries(sessionStore).filter(
        (entry): entry is [string, number] =>
          typeof entry[0] === "string" && typeof entry[1] === "number",
      ),
    );
  } catch {
    return {};
  }
};

const flushSimilarPageIndexSessionStore = () => {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  if (similarPageIndexByAnchor.size === 0) {
    sessionStorage.removeItem(SIMILAR_PAGE_INDEX_SESSION_KEY);
    return;
  }

  sessionStorage.setItem(
    SIMILAR_PAGE_INDEX_SESSION_KEY,
    JSON.stringify(Object.fromEntries(similarPageIndexByAnchor)),
  );
};

const hydrateSimilarPageIndexByAnchor = () => {
  for (const [anchorKey, index] of Object.entries(
    readSimilarPageIndexSessionStore(),
  )) {
    similarPageIndexByAnchor.set(anchorKey, index);
  }
};

hydrateSimilarPageIndexByAnchor();

export const clearSimilarReleasesPageIndexByAnchor = () => {
  similarPageIndexByAnchor.clear();
  flushSimilarPageIndexSessionStore();
};

export const persistSimilarPageIndexForAnchor = (
  anchorKey: string,
  index: number,
) => {
  if (!anchorKey) {
    return;
  }

  similarPageIndexByAnchor.set(anchorKey, index);
  flushSimilarPageIndexSessionStore();
};

const clampSimilarPageIndex = (index: number, pageCount: number) => {
  if (pageCount <= 0) {
    return 0;
  }

  return Math.min(index, pageCount - 1);
};

const readSimilarPageIndexFromMemory = (
  persistKey: string,
  anchorKey: string,
) => {
  const memoryKey = persistKey || anchorKey;

  if (!memoryKey) {
    return 0;
  }

  return similarPageIndexByAnchor.get(memoryKey) ?? 0;
};

const resolveSimilarPageIndex = (
  anchorKey: string,
  persistKey: string,
  collectionReleaseCount: number,
  previous: SimilarReleasesPageState,
  pageCount: number,
): SimilarReleasesPageState => {
  const anchorChanged = previous.anchorKey !== anchorKey;
  const collectionChanged = previous.collectionCount !== collectionReleaseCount;

  if (anchorChanged) {
    persistSimilarPageIndexForAnchor(previous.anchorKey, previous.index);
    const restored = readSimilarPageIndexFromMemory(persistKey, anchorKey);

    const index =
      pageCount <= 0 ? restored : clampSimilarPageIndex(restored, pageCount);

    return {
      anchorKey,
      collectionCount: collectionReleaseCount,
      index,
    };
  }

  if (collectionChanged) {
    persistSimilarPageIndexForAnchor(anchorKey, 0);

    return {
      anchorKey,
      collectionCount: collectionReleaseCount,
      index: 0,
    };
  }

  if (pageCount <= 0) {
    return previous;
  }

  const clampedIndex = clampSimilarPageIndex(previous.index, pageCount);

  return clampedIndex === previous.index
    ? previous
    : { ...previous, index: clampedIndex };
};

export const useSimilarReleasesPageState = (
  deferredSimilarSourceKey: string | null,
  persistAnchorKey: string | null,
  collectionReleaseCount: number,
  pageCount: number,
) => {
  const anchorKey = deferredSimilarSourceKey ?? "";
  const persistKey = persistAnchorKey ?? "";
  const [pageState, setPageState] = useState<SimilarReleasesPageState>(() => {
    const restored = readSimilarPageIndexFromMemory(persistKey, anchorKey);

    return {
      anchorKey,
      collectionCount: collectionReleaseCount,
      index:
        pageCount <= 0 ? restored : clampSimilarPageIndex(restored, pageCount),
    };
  });

  const syncedPageState = resolveSimilarPageIndex(
    anchorKey,
    persistKey,
    collectionReleaseCount,
    pageState,
    pageCount,
  );

  if (
    syncedPageState.anchorKey !== pageState.anchorKey ||
    syncedPageState.collectionCount !== pageState.collectionCount ||
    syncedPageState.index !== pageState.index
  ) {
    setPageState(syncedPageState);
  }

  const similarPageIndex = syncedPageState.index;

  const goSimilarPagePrev = useCallback(() => {
    setPageState((previous) => {
      const index = Math.max(0, previous.index - 1);
      persistSimilarPageIndexForAnchor(persistKey || previous.anchorKey, index);

      return { ...previous, index };
    });
  }, [persistKey]);

  const goSimilarPageNext = useCallback(() => {
    setPageState((previous) => {
      const index =
        pageCount <= 0 ? 0 : Math.min(pageCount - 1, previous.index + 1);
      persistSimilarPageIndexForAnchor(persistKey || previous.anchorKey, index);

      return { ...previous, index };
    });
  }, [pageCount, persistKey]);

  return {
    similarPageIndex,
    goSimilarPagePrev,
    goSimilarPageNext,
  };
};
