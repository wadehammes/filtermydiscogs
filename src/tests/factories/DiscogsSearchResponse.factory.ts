import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsSearchResponse } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";

type DiscogsSearchResponseFactoryOptions = Record<string, never>;

class DiscogsSearchResponseFactory extends BaseFactory<
  DiscogsSearchResponse,
  DiscogsSearchResponseFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsSearchResponse>,
    _options?: DiscogsSearchResponseFactoryOptions,
  ): DiscogsSearchResponse {
    const instance = {
      pagination: {
        page: 1,
        pages: 1,
        per_page: 100,
        items: 0,
        urls: { next: "", prev: "" },
      },
      results: [],
    } satisfies DiscogsSearchResponse;

    const factoryBuilt: DiscogsSearchResponse = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      DiscogsSearchResponse,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  empty(): DiscogsSearchResponse {
    return this.build();
  }
}

export const discogsSearchResponseFactory = new DiscogsSearchResponseFactory();
