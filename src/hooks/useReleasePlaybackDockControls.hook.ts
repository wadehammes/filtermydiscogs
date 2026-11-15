"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReleasePlaybackEmbedProgress } from "src/hooks/useReleasePlaybackEmbedProgress.hook";
import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { ReleasePlaybackEmbedProgressState } from "src/types/releasePlaybackContext.types";
import {
  DEFAULT_PLAYBACK_DOCK_VOLUME,
  readPlaybackDockVolume,
  writePlaybackDockVolume,
} from "src/utils/playbackDockVolumeStorage";
import { clampPlaybackSeekSeconds } from "src/utils/playbackEmbedProgress";
import {
  muteYoutubeEmbed,
  requestYoutubeEmbedPlaybackSync,
  seekYoutubeEmbed,
  setYoutubeEmbedVolume,
  unmuteYoutubeEmbed,
} from "src/utils/postYoutubePlayerCommand";
import { parseYoutubeVideoId } from "src/utils/releasePlayback";

export const resolvePlaybackDockEmbedProgressResetKey = ({
  release,
  previewVideo,
  playbackVideoId,
}: {
  release: DiscogsRelease | null;
  previewVideo: DiscogsVideo | null;
  playbackVideoId: string | null;
}): string | null => {
  if (!release) {
    return null;
  }

  if (previewVideo) {
    const previewYoutubeId = parseYoutubeVideoId(previewVideo.uri);

    return previewYoutubeId ? `preview:${previewYoutubeId}` : previewVideo.uri;
  }

  return playbackVideoId ?? release.instance_id;
};

export const useReleasePlaybackDockEmbedProgress = ({
  release,
  previewVideo,
  playbackVideoId,
}: {
  release: DiscogsRelease | null;
  previewVideo: DiscogsVideo | null;
  playbackVideoId: string | null;
}) => {
  const {
    embedProgress,
    handleInfoDelivery,
    resetEmbedProgress,
    applyLocalSeekSeconds,
  } = useReleasePlaybackEmbedProgress();

  const embedProgressResetKey = useMemo(
    () =>
      resolvePlaybackDockEmbedProgressResetKey({
        release,
        previewVideo,
        playbackVideoId,
      }),
    [playbackVideoId, previewVideo, release],
  );

  const appliedEmbedProgressResetKeyRef = useRef<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (appliedEmbedProgressResetKeyRef.current === embedProgressResetKey) {
      return;
    }

    appliedEmbedProgressResetKeyRef.current = embedProgressResetKey;
    resetEmbedProgress();
  }, [embedProgressResetKey, resetEmbedProgress]);

  const embedProgressValue = useMemo(
    (): ReleasePlaybackEmbedProgressState => ({ embedProgress }),
    [embedProgress],
  );

  return {
    applyLocalSeekSeconds,
    embedProgress,
    embedProgressValue,
    handleInfoDelivery,
  };
};

export const useReleasePlaybackDockTransport = ({
  playbackIframeRef,
  lastInfoDeliveryCurrentTimeRef,
  registerPlaybackIframeBase,
  embedProgress,
  applyLocalSeekSeconds,
  isPlaybackReady,
}: {
  playbackIframeRef: RefObject<HTMLIFrameElement | null>;
  lastInfoDeliveryCurrentTimeRef: RefObject<number | null | undefined>;
  registerPlaybackIframeBase: (iframe: HTMLIFrameElement | null) => void;
  embedProgress: ReturnType<
    typeof useReleasePlaybackEmbedProgress
  >["embedProgress"];
  applyLocalSeekSeconds: (seconds: number) => void;
  isPlaybackReady: boolean;
}) => {
  const initialPlaybackDockVolume = readPlaybackDockVolume();
  const [playbackDockMuted, setPlaybackDockMuted] = useState(
    initialPlaybackDockVolume === 0,
  );
  const playbackDockVolumeRef = useRef(initialPlaybackDockVolume);
  const playbackDockMutedRef = useRef(initialPlaybackDockVolume === 0);

  const syncPlaybackDockMuted = useCallback((muted: boolean) => {
    playbackDockMutedRef.current = muted;
    setPlaybackDockMuted(muted);
  }, []);

  useEffect(() => {
    if (isPlaybackReady) {
      return;
    }

    const storedVolume = readPlaybackDockVolume();
    playbackDockVolumeRef.current = storedVolume;
    syncPlaybackDockMuted(storedVolume === 0);
  }, [isPlaybackReady, syncPlaybackDockMuted]);

  const applyPlaybackDockVolumeToEmbed = useCallback(() => {
    const iframe = playbackIframeRef.current;

    if (!iframe) {
      return;
    }

    if (playbackDockMutedRef.current || playbackDockVolumeRef.current === 0) {
      muteYoutubeEmbed(iframe);
      return;
    }

    unmuteYoutubeEmbed(iframe);
    setYoutubeEmbedVolume({
      iframe,
      volume: playbackDockVolumeRef.current,
    });
  }, [playbackIframeRef]);

  const registerPlaybackIframe = useCallback(
    (iframe: HTMLIFrameElement | null) => {
      registerPlaybackIframeBase(iframe);

      if (iframe) {
        applyPlaybackDockVolumeToEmbed();
      }
    },
    [applyPlaybackDockVolumeToEmbed, registerPlaybackIframeBase],
  );

  const seekPlayback = useCallback(
    (seconds: number) => {
      const iframe = playbackIframeRef.current;

      if (!iframe) {
        return;
      }

      const clamped = clampPlaybackSeekSeconds({
        seconds,
        duration: embedProgress?.duration ?? null,
      });

      seekYoutubeEmbed({ iframe, seconds: clamped });
      lastInfoDeliveryCurrentTimeRef.current = clamped;
      applyLocalSeekSeconds(clamped);
      requestYoutubeEmbedPlaybackSync(iframe);
    },
    [
      applyLocalSeekSeconds,
      embedProgress?.duration,
      lastInfoDeliveryCurrentTimeRef,
      playbackIframeRef,
    ],
  );

  const setPlaybackVolume = useCallback(
    (volume: number) => {
      const clampedVolume = Math.min(100, Math.max(0, Math.round(volume)));
      playbackDockVolumeRef.current = clampedVolume;
      syncPlaybackDockMuted(clampedVolume === 0);
      writePlaybackDockVolume(clampedVolume);
      applyPlaybackDockVolumeToEmbed();
    },
    [applyPlaybackDockVolumeToEmbed, syncPlaybackDockMuted],
  );

  const togglePlaybackMute = useCallback(() => {
    const nextMuted = !playbackDockMutedRef.current;
    syncPlaybackDockMuted(nextMuted);

    if (!nextMuted && playbackDockVolumeRef.current === 0) {
      playbackDockVolumeRef.current = DEFAULT_PLAYBACK_DOCK_VOLUME;
      writePlaybackDockVolume(DEFAULT_PLAYBACK_DOCK_VOLUME);
    }

    applyPlaybackDockVolumeToEmbed();
  }, [applyPlaybackDockVolumeToEmbed, syncPlaybackDockMuted]);

  return {
    playbackDockMuted,
    registerPlaybackIframe,
    seekPlayback,
    setPlaybackVolume,
    togglePlaybackMute,
  };
};
