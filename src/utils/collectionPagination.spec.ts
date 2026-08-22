import { describe, expect, it } from "@jest/globals";
import {
  COLLECTION_FIRST_PAGE_SIZE,
  COLLECTION_PAGE_SIZE,
} from "src/constants/collection";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { persistCollectionItemCount } from "src/utils/collectionItemCountStorage";
import {
  COLLECTION_BOOTSTRAP_PAGE_PARAM,
  COLLECTION_FULL_PAGE_PARAM,
  getEffectiveCollectionPages,
  getInitialCollectionPageParam,
  getNextCollectionPageParam,
  shouldSkipCollectionBootstrap,
} from "src/utils/collectionPagination";

describe("shouldSkipCollectionBootstrap", () => {
  it("returns true when the collection exceeds one full page", () => {
    expect(shouldSkipCollectionBootstrap(101)).toBe(true);
    expect(shouldSkipCollectionBootstrap(11_400)).toBe(true);
  });

  it("returns false for small collections", () => {
    expect(shouldSkipCollectionBootstrap(100)).toBe(false);
    expect(shouldSkipCollectionBootstrap(20)).toBe(false);
  });
});

describe("getInitialCollectionPageParam", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses full page size when a large collection was stored", () => {
    persistCollectionItemCount("crate-digger", 11_400);

    expect(getInitialCollectionPageParam("crate-digger")).toEqual(
      COLLECTION_FULL_PAGE_PARAM,
    );
  });

  it("uses bootstrap page size when the collection size is unknown", () => {
    expect(getInitialCollectionPageParam("crate-digger")).toEqual(
      COLLECTION_BOOTSTRAP_PAGE_PARAM,
    );
  });
});

describe("getNextCollectionPageParam", () => {
  it("restarts at full page size after a bootstrap page with more results", () => {
    const bootstrap = collectionFactory.build(
      {},
      { page: 1, totalPages: 3, totalItems: 250 },
    );
    bootstrap.pagination.per_page = COLLECTION_FIRST_PAGE_SIZE;
    bootstrap.pagination.urls.next =
      "https://api.discogs.com/users/test/collection/folders/0/releases?page=2&per_page=50";

    expect(
      getNextCollectionPageParam({
        lastPage: bootstrap,
        allPages: [bootstrap],
      }),
    ).toEqual({
      page: 1,
      perPage: COLLECTION_PAGE_SIZE,
    });
  });

  it("stops after bootstrap when the collection fits on the first page", () => {
    const bootstrap = collectionFactory.build(
      {},
      { page: 1, totalPages: 1, totalItems: 20 },
    );
    bootstrap.pagination.per_page = COLLECTION_FIRST_PAGE_SIZE;
    bootstrap.pagination.urls.next = "";

    expect(
      getNextCollectionPageParam({
        lastPage: bootstrap,
        allPages: [bootstrap],
      }),
    ).toBeUndefined();
  });

  it("continues full-size pages from the Discogs next URL", () => {
    const page = collectionFactory.build(
      {},
      { page: 1, totalPages: 3, totalItems: 250 },
    );
    page.pagination.per_page = COLLECTION_PAGE_SIZE;

    expect(
      getNextCollectionPageParam({ lastPage: page, allPages: [page] }),
    ).toEqual({
      page: 2,
      perPage: COLLECTION_PAGE_SIZE,
    });
  });
});

describe("getEffectiveCollectionPages", () => {
  it("keeps a single bootstrap page", () => {
    const bootstrap = collectionFactory.build();

    expect(getEffectiveCollectionPages({ pages: [bootstrap] })).toEqual([
      bootstrap,
    ]);
  });

  it("drops the bootstrap page once full-size pages exist", () => {
    const bootstrap = collectionFactory.build();
    bootstrap.pagination.per_page = COLLECTION_FIRST_PAGE_SIZE;
    const full = collectionFactory.build({}, { page: 1, totalPages: 2 });
    full.pagination.per_page = COLLECTION_PAGE_SIZE;

    expect(getEffectiveCollectionPages({ pages: [bootstrap, full] })).toEqual([
      full,
    ]);
  });

  it("keeps all full-size pages when bootstrap was skipped", () => {
    const first = collectionFactory.build({}, { page: 1, totalPages: 3 });
    first.pagination.per_page = COLLECTION_PAGE_SIZE;
    const second = collectionFactory.build({}, { page: 2, totalPages: 3 });
    second.pagination.per_page = COLLECTION_PAGE_SIZE;

    expect(getEffectiveCollectionPages({ pages: [first, second] })).toEqual([
      first,
      second,
    ]);
  });
});
