import { describe, expect, it } from "@jest/globals";
import {
  COLLECTION_FIRST_PAGE_SIZE,
  COLLECTION_PAGE_SIZE,
} from "src/constants/collection";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import {
  getEffectiveCollectionPages,
  getNextCollectionPageParam,
} from "src/utils/collectionPagination";

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
    const full = collectionFactory.build({}, { page: 1, totalPages: 2 });

    expect(getEffectiveCollectionPages({ pages: [bootstrap, full] })).toEqual([
      full,
    ]);
  });
});
