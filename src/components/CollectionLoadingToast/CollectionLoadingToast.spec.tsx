import { describe, expect, it } from "@jest/globals";
import type { ReactElement } from "react";
import {
  COLLECTION_LOADING_TOAST_ID,
  formatLargeCollectionLoadingProgress,
  formatLargeCollectionLoadingTitle,
  resolveCollectionTotalItems,
  showCollectionLoadingToast,
} from "src/components/CollectionLoadingToast/collectionLoadingToast";
import { isLargeCollection } from "src/constants/collection";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { persistCollectionItemCount } from "src/utils/collectionItemCountStorage";
import { toast } from "src/utils/toast";
import { render, screen } from "test-utils";

jest.mock("src/utils/toast", () => ({
  toast: {
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockToastLoading = jest.mocked(toast.loading);

describe("collection loading helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("treats collections over 1000 items as large", () => {
    expect(isLargeCollection(1000)).toBe(false);
    expect(isLargeCollection(1001)).toBe(true);
  });

  it("formats large collection loading title and progress", () => {
    expect(formatLargeCollectionLoadingTitle(11400)).toBe(
      "Loading 11,400 releases from Discogs…",
    );
    expect(formatLargeCollectionLoadingProgress(2400, 11400)).toBe(
      "2,400 of 11,400 loaded",
    );
  });

  it("prefers pagination.items when resolving total collection size", () => {
    const collection = collectionFactory.build({}, { totalItems: 3200 });

    expect(resolveCollectionTotalItems("testuser", collection)).toBe(3200);
  });

  it("falls back to stored collection size before the first page arrives", () => {
    persistCollectionItemCount("testuser", 11400);

    expect(resolveCollectionTotalItems("testuser", null)).toBe(11400);
  });
});

describe("showCollectionLoadingToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a bottom-center loading toast for large collections", () => {
    showCollectionLoadingToast({ loadedCount: 900, totalItems: 3200 });

    expect(mockToastLoading).toHaveBeenCalledWith(
      "Loading 3,200 releases from Discogs…",
      expect.objectContaining({
        id: COLLECTION_LOADING_TOAST_ID,
        duration: Number.POSITIVE_INFINITY,
        position: "bottom-center",
        description: expect.objectContaining({
          props: expect.objectContaining({
            loadedCount: 900,
            totalItems: 3200,
          }),
        }),
        icon: expect.objectContaining({ props: expect.any(Object) }),
        classNames: expect.objectContaining({
          toast: "fmd-toast fmd-collection-loading-toast",
        }),
      }),
    );
  });

  it("does not show a toast for small collections", () => {
    showCollectionLoadingToast({ loadedCount: 900, totalItems: 900 });

    expect(mockToastLoading).not.toHaveBeenCalled();
  });

  it("omits progress text before the first page of releases arrives", () => {
    showCollectionLoadingToast({ loadedCount: 0, totalItems: 1500 });

    expect(mockToastLoading).toHaveBeenCalledWith(
      "Loading 1,500 releases from Discogs…",
      expect.objectContaining({
        description: expect.objectContaining({
          props: expect.objectContaining({
            loadedCount: 0,
            totalItems: 1500,
          }),
        }),
      }),
    );
  });

  it("renders toast description with phrasing content only for Toast.Description", () => {
    showCollectionLoadingToast({ loadedCount: 900, totalItems: 3200 });

    const description = mockToastLoading.mock.calls[0]?.[1]?.description as
      | ReactElement
      | undefined;

    expect(description).toBeDefined();

    const { container } = render(<p>{description}</p>);

    expect(container.querySelector("div")).toBeNull();
    expect(screen.getByText("900 of 3,200 loaded")).toBeInTheDocument();
    expect(screen.getByText("May take a minute or two.")).toBeInTheDocument();
  });
});
