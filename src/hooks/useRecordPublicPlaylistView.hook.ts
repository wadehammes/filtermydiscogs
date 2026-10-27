"use client";

import { useEffect } from "react";
import { useRecordPublicPlaylistViewMutation } from "src/hooks/mutations/usePublicPlaylistEngagementMutations";
import {
  hasRecentPublicPlaylistViewRecord,
  markPublicPlaylistViewRecordedInClient,
} from "src/utils/publicPlaylistViewDedupe.client";

export const useRecordPublicPlaylistView = (
  playlistId: string,
  enabled: boolean,
): void => {
  const { mutate: recordView } = useRecordPublicPlaylistViewMutation();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (hasRecentPublicPlaylistViewRecord(playlistId)) {
      return;
    }

    markPublicPlaylistViewRecordedInClient(playlistId);
    recordView(playlistId);
  }, [enabled, playlistId, recordView]);
};
