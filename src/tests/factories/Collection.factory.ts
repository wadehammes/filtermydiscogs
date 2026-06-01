import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsCollection, DiscogsPagination } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";

type CollectionFactoryOptions = {
  releaseCount?: number;
  page?: number;
  totalPages?: number;
  totalItems?: number;
  username?: string;
};

class CollectionFactory extends BaseFactory<
  DiscogsCollection,
  CollectionFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsCollection>,
    options?: CollectionFactoryOptions,
  ): DiscogsCollection {
    const page = options?.page ?? 1;
    const totalPages = options?.totalPages ?? 10;
    const totalItems = options?.totalItems ?? 500;
    const perPage = 50;
    const releaseCount = options?.releaseCount ?? perPage;
    const username = options?.username ?? faker.internet.username();

    const pagination: DiscogsPagination = {
      pages: totalPages,
      items: totalItems,
      urls: {
        next:
          page < totalPages
            ? `https://api.discogs.com/users/${username}/collection/folders/0/releases?page=${page + 1}`
            : "",
        prev:
          page > 1
            ? `https://api.discogs.com/users/${username}/collection/folders/0/releases?page=${page - 1}`
            : "",
      },
    };

    const instance = {
      pagination,
      releases: releaseFactory.buildList(releaseCount),
    } satisfies DiscogsCollection;

    const factoryBuilt: DiscogsCollection = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      DiscogsCollection,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const collectionFactory = new CollectionFactory();
