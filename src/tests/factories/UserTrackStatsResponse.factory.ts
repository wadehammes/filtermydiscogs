import type { UserTrackStatsResponse } from "src/api/endpoints/tracks";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { KeysMatch } from "src/types/KeysMatch";

type UserTrackStatsResponseFactoryOptions = Record<string, never>;

class UserTrackStatsResponseFactory extends BaseFactory<
  UserTrackStatsResponse,
  UserTrackStatsResponseFactoryOptions
> {
  build(
    attributes?: Partial<UserTrackStatsResponse>,
    _options?: UserTrackStatsResponseFactoryOptions,
  ): UserTrackStatsResponse {
    const instance = {
      stats: {},
    } satisfies UserTrackStatsResponse;

    const factoryBuilt: UserTrackStatsResponse = {
      ...instance,
      ...(attributes ?? {}),
    };

    const _allKeysMustBeInTheInstance: KeysMatch<
      UserTrackStatsResponse,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const userTrackStatsResponseFactory =
  new UserTrackStatsResponseFactory();
