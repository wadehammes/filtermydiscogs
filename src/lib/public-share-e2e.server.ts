import "server-only";

import { isE2eMockYoutubeEmbedEnabled } from "src/constants/e2ePlayback.constants";
import {
  LOGIN_DEMO_PUBLIC_CRATE_ID,
  LOGIN_DEMO_PUBLIC_CRATE_TITLE,
} from "src/constants/publicCrate.constants";
import {
  LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
  LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE,
} from "src/constants/publicPlaylist.constants";
import {
  E2E_PUBLIC_DEMO_CRATE_RELEASE_COUNT,
  E2E_PUBLIC_DEMO_OWNER_USERNAME,
  E2E_PUBLIC_DEMO_PLAYLIST_TRACK_COUNT,
} from "src/constants/publicShareE2e.constants";
import type { PublicShareMetadataKind } from "src/lib/public-share-metadata.server";

type PublicShareMetadataResolved = {
  name: string;
  username: string | null;
  itemCount: number;
};

export const getE2eDemoPublicShareMetadataResolved = (
  kind: PublicShareMetadataKind,
  id: string,
): PublicShareMetadataResolved | null => {
  if (!isE2eMockYoutubeEmbedEnabled()) {
    return null;
  }

  if (kind === "crate" && id === LOGIN_DEMO_PUBLIC_CRATE_ID) {
    return {
      name: LOGIN_DEMO_PUBLIC_CRATE_TITLE,
      username: E2E_PUBLIC_DEMO_OWNER_USERNAME,
      itemCount: E2E_PUBLIC_DEMO_CRATE_RELEASE_COUNT,
    };
  }

  if (kind === "playlist" && id === LOGIN_DEMO_PUBLIC_PLAYLIST_ID) {
    return {
      name: LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE,
      username: E2E_PUBLIC_DEMO_OWNER_USERNAME,
      itemCount: E2E_PUBLIC_DEMO_PLAYLIST_TRACK_COUNT,
    };
  }

  return null;
};

export const shouldNotFoundPublicSharePage = ({
  kind,
  id,
  hasServerPayload,
}: {
  kind: PublicShareMetadataKind;
  id: string;
  hasServerPayload: boolean;
}): boolean => {
  if (hasServerPayload) {
    return false;
  }

  if (getE2eDemoPublicShareMetadataResolved(kind, id) !== null) {
    return false;
  }

  return true;
};
