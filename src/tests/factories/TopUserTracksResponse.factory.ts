import { BaseFactory } from "src/tests/factories/BaseFactory";
import { topUserTrackFactory } from "src/tests/factories/TopUserTrack.factory";
import type { TopUserTracksResponse } from "src/types/dashboard.types";
import type { KeysMatch } from "src/types/KeysMatch";

type TopUserTracksResponseFactoryOptions = Record<string, never>;

class TopUserTracksResponseFactory extends BaseFactory<
  TopUserTracksResponse,
  TopUserTracksResponseFactoryOptions
> {
  build(
    attributes?: Partial<TopUserTracksResponse>,
    _options?: TopUserTracksResponseFactoryOptions,
  ): TopUserTracksResponse {
    const instance = {
      most_played: [topUserTrackFactory.build()],
      most_listened: [topUserTrackFactory.build()],
    } satisfies TopUserTracksResponse;

    const factoryBuilt: TopUserTracksResponse = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      TopUserTracksResponse,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  empty(
    attributes: Partial<TopUserTracksResponse> = {},
  ): TopUserTracksResponse {
    return this.build({
      most_played: [],
      most_listened: [],
      ...attributes,
    });
  }
}

export const topUserTracksResponseFactory = new TopUserTracksResponseFactory();
