import { beforeEach, describe, expect, it } from "@jest/globals";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { filtersDispatchAtom } from "src/atoms/filters.atoms";
import { CollectionLoadingToast } from "src/components/CollectionLoadingToast/CollectionLoadingToast.component";
import { COLLECTION_LOADING_TOAST_ID } from "src/components/CollectionLoadingToast/collectionLoadingToast";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsCollection } from "src/types";
import { toast } from "src/utils/toast";
import { render, waitFor } from "test-utils";

jest.mock("src/utils/toast", () => ({
  toast: {
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockToastLoading = jest.mocked(toast.loading);
const mockToastDismiss = jest.mocked(toast.dismiss);

function CollectionLoadingToastHarness({
  collection,
  fetchingCollection,
}: {
  collection: DiscogsCollection | null;
  fetchingCollection: boolean;
}) {
  const { dispatchCollection, dispatchFetchingCollection } =
    useCollectionContext();
  const filtersDispatch = useSetAtom(filtersDispatchAtom);

  useEffect(() => {
    if (collection) {
      dispatchCollection(collection);
      filtersDispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: collection.releases,
      });
    }
    dispatchFetchingCollection(fetchingCollection);
  }, [
    collection,
    dispatchCollection,
    dispatchFetchingCollection,
    fetchingCollection,
    filtersDispatch,
  ]);

  return <CollectionLoadingToast />;
}

describe("CollectionLoadingToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a bottom-center loading toast while a large collection is fetching", async () => {
    const collection = collectionFactory.build({}, { totalItems: 1500 });
    collection.releases = releaseFactory.buildList(400);

    render(
      <CollectionLoadingToastHarness
        collection={collection}
        fetchingCollection
      />,
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(mockToastLoading).toHaveBeenCalledWith(
        "Loading 1,500 releases from Discogs…",
        expect.objectContaining({
          id: COLLECTION_LOADING_TOAST_ID,
          position: "bottom-center",
        }),
      );
    });
  });

  it("dismisses the toast when collection loading finishes", async () => {
    const collection = collectionFactory.build({}, { totalItems: 1500 });

    const { rerender } = render(
      <CollectionLoadingToastHarness
        collection={collection}
        fetchingCollection
      />,
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(mockToastLoading).toHaveBeenCalled();
    });

    rerender(
      <CollectionLoadingToastHarness
        collection={collection}
        fetchingCollection={false}
      />,
    );

    await waitFor(() => {
      expect(mockToastDismiss).toHaveBeenCalledWith(
        COLLECTION_LOADING_TOAST_ID,
      );
    });
  });

  it("does not show a toast for small collections", async () => {
    const collection = collectionFactory.build({}, { totalItems: 900 });

    render(
      <CollectionLoadingToastHarness
        collection={collection}
        fetchingCollection
      />,
      {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      },
    );

    await waitFor(() => {
      expect(mockToastDismiss).toHaveBeenCalledWith(
        COLLECTION_LOADING_TOAST_ID,
      );
    });

    expect(mockToastLoading).not.toHaveBeenCalled();
  });
});
