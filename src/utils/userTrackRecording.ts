import { recordTrackEvent } from "src/api/endpoints/tracks";
import type { UserTrackRecordBody } from "src/lib/validation/userTrack.schemas";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { getQueueItemKey } from "src/utils/playbackQueue";
import {
  buildUserTrackFieldsFromQueueItem,
  TRACK_LISTEN_MIN_MS,
  type UserTrackRecordFields,
} from "src/utils/userTrack";

let lastRecordedPlayTrackKey: string | null = null;
let listenSessionTrackKey: string | null = null;
let listenAccumulatedMs = 0;
let listenCreditedForSession = false;
let activeListenItem: PlaybackQueueItem | null = null;

type RecordTrackEventFn = (body: UserTrackRecordBody) => void;

let recordTrackEventFn: RecordTrackEventFn = (body) => {
  void recordTrackEvent(body);
};

const buildRecordPayload = (
  event: "play" | "listen",
  fields: UserTrackRecordFields,
): UserTrackRecordBody => ({
  event,
  ...fields,
});

const submitRecord = (body: UserTrackRecordBody): void => {
  recordTrackEventFn(body);
};

const creditListen = (fields: UserTrackRecordFields): void => {
  if (listenCreditedForSession) {
    return;
  }

  listenCreditedForSession = true;
  submitRecord(buildRecordPayload("listen", fields));
};

const syncListenSession = (trackKey: string): void => {
  if (listenSessionTrackKey === trackKey) {
    return;
  }

  listenSessionTrackKey = trackKey;
  listenAccumulatedMs = 0;
  listenCreditedForSession = false;
};

export const bindRecordTrackEvent = (fn: RecordTrackEventFn): void => {
  recordTrackEventFn = fn;
};

export const resetRecordTrackEventBinding = (): void => {
  recordTrackEventFn = (body) => {
    void recordTrackEvent(body);
  };
};

export const setActiveListenQueueItem = (
  item: PlaybackQueueItem | null,
): void => {
  activeListenItem = item;
};

export const creditTrackListenOnEmbedEndedForActiveItem = (): void => {
  if (!activeListenItem) {
    return;
  }

  creditTrackListenOnEmbedEnded(activeListenItem);
};

export const resetUserTrackRecordingSession = (): void => {
  lastRecordedPlayTrackKey = null;
  listenSessionTrackKey = null;
  listenAccumulatedMs = 0;
  listenCreditedForSession = false;
  activeListenItem = null;
};

export const recordTrackPlayFromQueueItem = (
  item: PlaybackQueueItem,
  youtubeId?: string | null,
): void => {
  const trackKey = getQueueItemKey(item);
  const fields = buildUserTrackFieldsFromQueueItem(item, youtubeId);

  syncListenSession(trackKey);

  if (lastRecordedPlayTrackKey === trackKey) {
    return;
  }

  lastRecordedPlayTrackKey = trackKey;
  submitRecord(buildRecordPayload("play", fields));
};

export const tickTrackListenMs = (
  item: PlaybackQueueItem,
  deltaMs: number,
): void => {
  const trackKey = getQueueItemKey(item);
  const fields = buildUserTrackFieldsFromQueueItem(item);

  syncListenSession(trackKey);

  if (listenCreditedForSession) {
    return;
  }

  listenAccumulatedMs += deltaMs;

  if (listenAccumulatedMs >= TRACK_LISTEN_MIN_MS) {
    creditListen(fields);
  }
};

export const creditTrackListenOnEmbedEnded = (
  item: PlaybackQueueItem,
): void => {
  const trackKey = getQueueItemKey(item);
  const fields = buildUserTrackFieldsFromQueueItem(item);

  syncListenSession(trackKey);
  creditListen(fields);
};
