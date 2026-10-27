import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";
import type { PlaylistSummary } from "src/types/playlist.types";

type PlaylistSummaryFactoryOptions = Record<string, never>;

class PlaylistSummaryFactory extends BaseFactory<
  PlaylistSummary,
  PlaylistSummaryFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistSummary>,
    _options?: PlaylistSummaryFactoryOptions,
  ): PlaylistSummary {
    const created = faker.date.past();
    const updated = faker.date.between({ from: created, to: new Date() });

    const base = {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "Sunday spins",
        "Late night",
        "Warm-up set",
        faker.word.noun(),
      ]),
      trackCount: faker.number.int({ min: 0, max: 40 }),
      created_at: created.toISOString(),
      updated_at: updated.toISOString(),
    } satisfies Omit<
      PlaylistSummary,
      "containsTrack" | "private" | "publicViewCount" | "publicPlayCount"
    >;

    const _allKeysMustBeInTheInstance: KeysMatch<
      Omit<
        PlaylistSummary,
        "containsTrack" | "private" | "publicViewCount" | "publicPlayCount"
      >,
      typeof base
    > = undefined;

    const factoryBuilt = mergeFactoryAttributes(
      { ...base, private: true },
      attributes,
    );

    return factoryBuilt;
  }

  empty(attributes: Partial<PlaylistSummary> = {}): PlaylistSummary {
    return this.build({
      id: "playlist-empty",
      name: "Empty playlist",
      trackCount: 0,
      created_at: "2026-10-01T00:00:00.000Z",
      updated_at: "2026-10-01T00:00:00.000Z",
      ...attributes,
    });
  }
}

export const playlistSummaryFactory = new PlaylistSummaryFactory();
