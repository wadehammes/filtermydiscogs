import { atom } from "jotai";

export const collectionRadioActiveAtom = atom(false);

export const collectionRadioSessionReleaseIdsKeyAtom = atom<string | null>(
  null,
);
