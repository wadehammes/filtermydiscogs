import { faker } from "@faker-js/faker";
import type { PlaybackSkipSentryDetails } from "src/lib/sentry/buildPlaybackSkipSentryEvent";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import {
  type FactoryOverrides,
  mergeFactoryAttributes,
} from "src/tests/factories/mergeFactoryAttributes";
import { definedProps } from "src/utils/definedProps";
import {
  PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
  resolvePlaybackEmbedUnavailableReason,
} from "src/utils/playbackEmbedUnavailableSkip";
import type { PlaybackSkipLogEntry } from "src/utils/playbackSkippedTrackLog";
import {
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT,
  YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE,
} from "src/utils/playbackSkippedTrackLog";

type PlaybackSkipLogEntryFactoryOptions = Record<string, never>;

const PLAYBACK_SKIP_ERROR_CODES = [
  YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE,
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT,
  PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
  0,
  2,
  5,
] as const;

const buildPlaybackSkipTrackLabel = (): string => {
  const position = faker.string.alphanumeric({ length: 2, casing: "upper" });

  return `${position} ${faker.music.songName()} - ${faker.person.fullName()}, ${faker.music.album()}`;
};

const buildPlaybackSkipContext = (): PlaybackSkipSentryDetails =>
  definedProps({
    trackKey: `${faker.string.alphanumeric(8)}:${faker.string.alphanumeric(2)}`,
    youtubeVideoId: faker.string.alphanumeric(11),
    ...(faker.helpers.maybe(() => ({
      artist: faker.person.fullName(),
    })) ?? {}),
    ...(faker.helpers.maybe(() => ({
      releaseTitle: faker.music.album(),
    })) ?? {}),
    ...(faker.helpers.maybe(() => ({
      trackTitle: faker.music.songName(),
    })) ?? {}),
    ...(faker.helpers.maybe(() => ({
      trackPosition: faker.string.alphanumeric({ length: 2, casing: "upper" }),
    })) ?? {}),
  });

class PlaybackSkipLogEntryFactory extends BaseFactory<
  PlaybackSkipLogEntry,
  PlaybackSkipLogEntryFactoryOptions
> {
  build(
    attributes?: FactoryOverrides<PlaybackSkipLogEntry>,
    _options?: PlaybackSkipLogEntryFactoryOptions,
  ): PlaybackSkipLogEntry {
    const errorCode =
      attributes?.errorCode ??
      faker.helpers.arrayElement([...PLAYBACK_SKIP_ERROR_CODES]);

    const instance: PlaybackSkipLogEntry = {
      errorCode,
      trackLabel: buildPlaybackSkipTrackLabel(),
      reason: resolvePlaybackEmbedUnavailableReason(errorCode),
      ...definedProps({
        ...(faker.helpers.maybe(() => ({
          context: buildPlaybackSkipContext(),
        })) ?? {}),
      }),
    };

    return mergeFactoryAttributes(instance, attributes);
  }

  embedDisabledReport(
    attributes?: FactoryOverrides<PlaybackSkipLogEntry>,
  ): PlaybackSkipLogEntry {
    return this.build({
      errorCode: YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
      ...attributes,
    });
  }

  watchdogFallbackReport(
    attributes?: FactoryOverrides<PlaybackSkipLogEntry>,
  ): PlaybackSkipLogEntry {
    return this.build({
      errorCode: PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
      ...attributes,
    });
  }

  privateOrRemovedOnYoutube(
    attributes?: FactoryOverrides<PlaybackSkipLogEntry>,
  ): PlaybackSkipLogEntry {
    return this.build({
      errorCode: YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE,
      ...attributes,
    });
  }

  embedUnavailableFallback(
    attributes?: FactoryOverrides<PlaybackSkipLogEntry>,
  ): PlaybackSkipLogEntry {
    return this.build({
      errorCode: PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
      ...attributes,
    });
  }
}

export const playbackSkipLogEntryFactory = new PlaybackSkipLogEntryFactory();
