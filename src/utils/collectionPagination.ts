import {
  COLLECTION_FIRST_PAGE_SIZE,
  COLLECTION_PAGE_SIZE,
} from "src/constants/collection";
import type { DiscogsCollection } from "src/types";

export type CollectionPageParam = {
  page: number;
  perPage: number;
};

export const COLLECTION_BOOTSTRAP_PAGE_PARAM: CollectionPageParam = {
  page: 1,
  perPage: COLLECTION_FIRST_PAGE_SIZE,
};

export interface GetNextCollectionPageParamParams {
  lastPage: DiscogsCollection;
  allPages: DiscogsCollection[];
}

export const getNextCollectionPageParam = ({
  lastPage,
  allPages,
}: GetNextCollectionPageParamParams): CollectionPageParam | undefined => {
  const isBootstrapOnly =
    allPages.length === 1 &&
    lastPage.pagination?.per_page === COLLECTION_FIRST_PAGE_SIZE;

  if (isBootstrapOnly) {
    if (!lastPage.pagination?.urls?.next) {
      return undefined;
    }

    return { page: 1, perPage: COLLECTION_PAGE_SIZE };
  }

  if (!lastPage.pagination?.urls?.next) {
    return undefined;
  }

  const url = new URL(lastPage.pagination.urls.next);
  const pageParam = url.searchParams.get("page");
  const page = pageParam ? Number.parseInt(pageParam, 10) : Number.NaN;

  if (!Number.isFinite(page) || page < 1) {
    return undefined;
  }

  return { page, perPage: COLLECTION_PAGE_SIZE };
};

export interface GetEffectiveCollectionPagesParams {
  pages: DiscogsCollection[];
}

export const getEffectiveCollectionPages = ({
  pages,
}: GetEffectiveCollectionPagesParams): DiscogsCollection[] =>
  pages.length > 1 ? pages.slice(1) : pages;
