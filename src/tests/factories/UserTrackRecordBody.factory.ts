import type { UserTrackRecordBody } from "src/lib/validation/userTrack.schemas";
import { BaseFactory } from "src/tests/factories/BaseFactory";

type UserTrackRecordBodyFactoryOptions = Record<string, never>;

class UserTrackRecordBodyFactory extends BaseFactory<
  UserTrackRecordBody,
  UserTrackRecordBodyFactoryOptions
> {
  build(
    attributes?: Partial<UserTrackRecordBody>,
    _options?: UserTrackRecordBodyFactoryOptions,
  ): UserTrackRecordBody {
    const factoryBuilt: UserTrackRecordBody = {
      event: "play",
      track_key: "inst-1:A1",
      track_title: "Track One",
      track_position: "A1",
      instance_id: "inst-1",
      youtube_id: "dQw4w9WgXcQ",
      artist: "Test Artist",
      release_title: "Test Album",
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }

  play(attributes?: Partial<UserTrackRecordBody>): UserTrackRecordBody {
    return this.build({ event: "play", ...attributes });
  }

  listen(attributes?: Partial<UserTrackRecordBody>): UserTrackRecordBody {
    return this.build({ event: "listen", ...attributes });
  }
}

export const userTrackRecordBodyFactory = new UserTrackRecordBodyFactory();
