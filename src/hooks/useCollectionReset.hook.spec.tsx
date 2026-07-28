import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue } from "jotai";
import {
  allReleasesAtom,
  collectionFiltersActiveAtom,
} from "src/atoms/filters.atoms";
import { useCollectionContext } from "src/context/collection.context";
import { useCollectionReset } from "src/hooks/useCollectionReset.hook";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { act, renderFeatureHook, waitFor } from "test-utils";

describe("useCollectionReset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears collection state and filter releases", async () => {
    const releases = releaseFactory.buildList(2);

    const { result } = renderFeatureHook(
      () => {
        const resetCollection = useCollectionReset();
        const allReleases = useAtomValue(allReleasesAtom);
        const collectionFiltersActive = useAtomValue(
          collectionFiltersActiveAtom,
        );
        const { state } = useCollectionContext();

        return {
          resetCollection,
          allReleases,
          collectionFiltersActive,
          collection: state.collection,
          fetchingCollection: state.fetchingCollection,
        };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.allReleases).toHaveLength(2);
    });

    expect(result.current.collection).not.toBeNull();

    act(() => {
      result.current.resetCollection();
    });

    expect(result.current.allReleases).toEqual([]);
    expect(result.current.collection).toBeNull();
    expect(result.current.fetchingCollection).toBe(true);
    expect(result.current.collectionFiltersActive).toBe(false);
  });
});
