import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import type { DiscogsReleaseJson } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

type DiscogsReleaseJsonFactoryOptions = Record<string, never>;

class DiscogsReleaseJsonFactory extends BaseFactory<
  DiscogsReleaseJson,
  DiscogsReleaseJsonFactoryOptions
> {
  build(
    attributes?: Partial<DiscogsReleaseJson>,
    _options?: DiscogsReleaseJsonFactoryOptions,
  ): DiscogsReleaseJson {
    const releaseId = faker.number.int({ min: 1, max: 999999 });

    const factoryBuilt: DiscogsReleaseJson = {
      uri: `https://www.discogs.com/release/${releaseId}`,
      ...(attributes ?? {}),
    };

    return factoryBuilt;
  }

  forReleaseId(
    releaseId: number | string,
    attributes: Partial<DiscogsReleaseJson> = {},
  ): DiscogsReleaseJson {
    return this.build({
      uri: `https://www.discogs.com/release/${releaseId}`,
      ...attributes,
    });
  }

  withTracklistAndVideos(
    attributes: Partial<DiscogsReleaseDetail> = {},
  ): DiscogsReleaseDetail {
    return this.build({
      id: 249504,
      uri: "https://www.discogs.com/Rick-Astley-Never-Gonna-Give-You-Up/release/249504",
      title: "Never Gonna Give You Up",
      artists: [{ name: "Rick Astley" }],
      tracklist: [
        {
          position: "A",
          title: "Never Gonna Give You Up",
          duration: "3:32",
          type_: "track",
        },
        {
          position: "B",
          title: "Never Gonna Give You Up (Instrumental)",
          duration: "3:30",
          type_: "track",
        },
      ],
      videos: [
        {
          description: "Rick Astley - Never Gonna Give You Up",
          duration: 330,
          embed: true,
          title: "Rick Astley - Never Gonna Give You Up",
          uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
        },
      ],
      ...attributes,
    }) as DiscogsReleaseDetail;
  }
}

export const discogsReleaseJsonFactory = new DiscogsReleaseJsonFactory();
