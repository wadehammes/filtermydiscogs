import type { DiscogsCollection, DiscogsPagination } from "src/types";
import { BaseFactory } from "./BaseFactory";
import { releaseFactory } from "./Release.factory";

type CollectionFactoryOptions = {
  releaseCount?: number;
  page?: number;
  totalPages?: number;
  totalItems?: number;
};

class CollectionFactory extends BaseFactory<
  DiscogsCollection,
  CollectionFactoryOptions
> {
  public build(
    attributes?: Partial<DiscogsCollection>,
    options?: CollectionFactoryOptions,
  ): DiscogsCollection {
    const page = options?.page ?? 1;
    const totalPages = options?.totalPages ?? 10;
    const totalItems = options?.totalItems ?? 500;
    const perPage = 50;
    const releaseCount = options?.releaseCount ?? perPage;

    const pagination: DiscogsPagination = {
      pages: totalPages,
      items: totalItems,
      urls: {
        next:
          page < totalPages
            ? `https://api.discogs.com/users/testuser/collection/folders/0/releases?page=${page + 1}`
            : "",
        prev:
          page > 1
            ? `https://api.discogs.com/users/testuser/collection/folders/0/releases?page=${page - 1}`
            : "",
      },
    };

    const instance = {
      pagination,
      releases: releaseFactory.buildList(releaseCount),
    } satisfies DiscogsCollection;

    return {
      ...instance,
      ...(attributes ?? {}),
    };
  }
}

export const collectionFactory = new CollectionFactory();
