import { atom } from "jotai";
import type { DiscogsRelease } from "src/types";

export type CollectionRadioSession = {
  orderedReleases: DiscogsRelease[];
  nextReleaseIndex: number;
};

export const collectionRadioSessionAtom = atom<CollectionRadioSession | null>(
  null,
);
