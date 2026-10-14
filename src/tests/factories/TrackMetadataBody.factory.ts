import { faker } from "@faker-js/faker";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";

type TrackMetadataBodyFactoryOptions = Record<string, never>;

class TrackMetadataBodyFactory extends BaseFactory<
  UserTrackMetadataBody,
  TrackMetadataBodyFactoryOptions
> {
  build(
    attributes?: Partial<UserTrackMetadataBody>,
    _options?: TrackMetadataBodyFactoryOptions,
  ): UserTrackMetadataBody {
    const instanceId = faker.string.numeric({ length: 4 });
    const position = faker.helpers.arrayElement(["A1", "A2", "B1"]);

    const instance: UserTrackMetadataBody = {
      track_key: `${instanceId}:${position}`,
      instance_id: instanceId,
      track_position: position,
      track_title: faker.music.songName(),
      artist: faker.helpers.maybe(() => faker.person.fullName()),
      release_title: faker.helpers.maybe(() => faker.music.album()),
      youtube_id: faker.helpers.maybe(() => "dQw4w9WgXcQ"),
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      UserTrackMetadataBody,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  opening(
    attributes: Partial<UserTrackMetadataBody> = {},
  ): UserTrackMetadataBody {
    return this.build({
      track_key: "9001:A1",
      instance_id: "9001",
      track_position: "A1",
      track_title: "Opening",
      artist: "Test Artist",
      release_title: "Test Album",
      youtube_id: "dQw4w9WgXcQ",
      ...attributes,
    });
  }
}

export const trackMetadataBodyFactory = new TrackMetadataBodyFactory();
