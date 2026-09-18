"use client";

import { useEffect } from "react";
import { useRecordTrackEventMutation } from "src/hooks/mutations/useTrackStatsMutations";
import { useTrackListenRecorder } from "src/hooks/useTrackListenRecorder.hook";
import {
  bindRecordTrackEvent,
  resetRecordTrackEventBinding,
} from "src/utils/userTrackRecording";

export const TrackStatsRecorder = () => {
  const { mutate } = useRecordTrackEventMutation();
  useTrackListenRecorder();

  useEffect(() => {
    bindRecordTrackEvent((body) => {
      mutate(body);
    });

    return () => {
      resetRecordTrackEventBinding();
    };
  }, [mutate]);

  return null;
};
