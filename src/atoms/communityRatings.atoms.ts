import { atom } from "jotai";
import {
  type CommunityRatingsCache,
  readCommunityRatingsCache,
} from "src/utils/communityRatingsStorage";

export const communityRatingsByReleaseIdAtom = atom<CommunityRatingsCache>(
  readCommunityRatingsCache(),
);

export const isLoadingCommunityRatingsAtom = atom(false);
