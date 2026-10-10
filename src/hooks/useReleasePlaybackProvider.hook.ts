"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { usePlaybackTrackYoutubeOverrides } from "src/hooks/usePlaybackTrackYoutubeOverrides.hook";
import { useReleasePlaybackPendingResolution } from "src/hooks/useReleasePlaybackPendingResolution.hook";
import { useReleasePlaybackQueueActions } from "src/hooks/useReleasePlaybackQueueActions.hook";
import { useReleasePlaybackQueueCoordination } from "src/hooks/useReleasePlaybackQueueCoordination.hook";
import { useReleasePlaybackQueueWarmup } from "src/hooks/useReleasePlaybackQueueWarmup.hook";
import { useReleasePlaybackReleaseDetail } from "src/hooks/useReleasePlaybackReleaseDetail.hook";
import {
  usePersistPlaybackSessionOnQueueChange,
  usePersistPlaybackSessionWhilePlaying,
  useRestorePlaybackSessionFromStorage,
} from "src/hooks/useReleasePlaybackSessionPersistence.hook";
import {
  createSimilarQueueMode,
  type SimilarQueueMode,
  useReleasePlaybackSimilarQueue,
} from "src/hooks/useReleasePlaybackSimilarQueue.hook";
import { useReleasePlaybackTransportToggle } from "src/hooks/useReleasePlaybackTransportToggle.hook";
import { useReleasePlaybackYoutubeEmbed } from "src/hooks/useReleasePlaybackYoutubeEmbed.hook";
import type { PlaybackSkipSentryContext } from "src/lib/sentry/reportPlaybackSkip";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type {
  ReleasePlaybackActions,
  ReleasePlaybackState,
  StartPlaybackParams,
} from "src/types/releasePlaybackContext.types";
import {
  DEFAULT_AUTO_PLAY_ON_QUEUE_ADD,
  DEFAULT_EXTEND_QUEUE_WITH_SIMILAR_RELEASES,
} from "src/types/userPreferences.types";
import { definedProps } from "src/utils/definedProps";
import { resolveEmbedUnavailableWatchdogOutcome } from "src/utils/embedUnavailableWatchdogOutcome";
import {
  classifyNetworkConnectionQuality,
  createEmbedPlaybackStartWatchdog,
  getNavigatorNetworkInformation,
  resolvePlaybackEmbedUnavailableWatchdogDelayMs,
  resolvePlaybackEmbedUnavailableWatchdogMs,
  shouldArmPlaybackEmbedStartWatchdog,
} from "src/utils/playbackEmbedStartWatchdog";
import {
  createPlaybackEmbedUnavailableSkipHandler,
  PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
} from "src/utils/playbackEmbedUnavailableSkip";
import { buildCurrentQueueItem } from "src/utils/playbackQueue";
import { isQueueItemReplayOfActiveSession } from "src/utils/playbackQueueReplay";
import {
  getSessionRelease,
  initialPlaybackSessionState,
  playbackSessionReducer,
  selectIsMiniPlayerVisible,
  selectIsPaused,
  selectIsPlaying,
} from "src/utils/playbackSessionState";
import { resolvePlaybackSkipLogDisplay } from "src/utils/playbackSkippedTrackLog";
import { appendPlaybackSkipAndSchedule } from "src/utils/playbackSkippedTrackToast";
import {
  PLAYBACK_VIDEO_UI_LOADING_TIMEOUT_MS,
  resolveActivePlaybackTitle,
  resolveActivePlaybackVideo,
  resolveActiveTrackPosition,
  resolveActiveVideoId,
  resolveIsPlaybackReady,
  resolvePlaybackVideoId,
  resolvePresentationActiveVideoId,
  shouldBeginPlaybackVideoUiLoading,
  shouldClearPlaybackVideoTransition,
} from "src/utils/releasePlaybackActivePresentation";
import { EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS } from "src/utils/releasePlaybackEmbedConfirm";
import { createPlaybackEndedAdvanceHandler } from "src/utils/releasePlaybackEndedAdvance";
import { shouldDeferEmbedStartWatchdogUntilAfterTabVisibleRecovery } from "src/utils/releasePlaybackHiddenTabTransport";
import { resolvePlaybackSkipSentryDetails } from "src/utils/resolvePlaybackSkipSentryDetails";
import { syncPlaybackSessionRefs } from "src/utils/syncPlaybackSessionRefs";
import {
  isAwaitingTrackStatsForYoutubeOverride,
  mergeTrackStatsFromQueryCache,
  resolveActiveTrackHasYoutubeOverride,
} from "src/utils/trackStatsQueryCache";
import { buildTrackKey } from "src/utils/userTrack";
import { recordTrackPlayFromQueueItem } from "src/utils/userTrackRecording";

export const useReleasePlaybackProvider = (): {
  actionsValue: ReleasePlaybackActions;
  isMiniPlayerVisible: boolean;
  queue: PlaybackQueueItem[];
  stateValue: ReleasePlaybackState;
} => {
  const { state: authState } = useAuth();
  const { isAuthenticated, isCheckingAuth } = authState;
  const {
    state: { fetchingCollection, collection },
  } = useCollectionContext();
  const { data: collectionQueryData, hasNextPage: queryHasNextPage } =
    useDiscogsCollectionQuery({
      username: authState.username || "",
      enabled: false,
    });
  const hasMoreCollectionPages =
    (collectionQueryData?.pages.length ?? 0) > 0
      ? queryHasNextPage
      : Boolean(collection?.pagination?.urls?.next);
  const allReleases = useAllReleases();
  const queryClient = useQueryClient();
  const { data: userPreferences } = useUserPreferencesQuery({
    userId: authState.userId,
    enabled: isAuthenticated,
  });
  const autoPlayOnQueueAdd =
    userPreferences?.autoPlayOnQueueAdd ?? DEFAULT_AUTO_PLAY_ON_QUEUE_ADD;
  const extendQueueWithSimilarReleases =
    userPreferences?.extendQueueWithSimilarReleases ??
    DEFAULT_EXTEND_QUEUE_WITH_SIMILAR_RELEASES;
  const [session, dispatchSession] = useReducer(
    playbackSessionReducer,
    initialPlaybackSessionState,
  );
  const release = getSessionRelease(session);
  const queue = session.queue;
  const playbackHistory = session.playbackHistory;
  const activeTrackIndex = session.activeTrackIndex;
  const previewVideo = session.kind === "idle" ? null : session.previewVideo;
  const pendingTrackPosition = session.pendingTrackPosition;
  const pendingPreviewVideoUri = session.pendingPreviewVideoUri;
  const isPlaying = selectIsPlaying(session);
  const isPaused = selectIsPaused(session);
  const [shouldAutoplayEmbed, setShouldAutoplayEmbed] = useState(false);
  const [isPlaybackEmbedMounted, setIsPlaybackEmbedMounted] = useState(false);
  const [embedVideoId, setEmbedVideoId] = useState<string | null>(null);
  const [playbackVideoTransitionTargetId, setPlaybackVideoTransitionTargetId] =
    useState<string | null>(null);
  const [isPlaybackVideoUiLoading, setIsPlaybackVideoUiLoading] =
    useState(false);
  const isPlaybackVideoUiLoadingRef = useRef(false);
  const playbackVideoTransitionTargetIdRef = useRef<string | null>(null);
  const playbackVideoUiLoadingTargetVideoIdRef = useRef<string | null>(null);
  const playbackVideoUiLoadingEmbedLoadStartedAtMsRef = useRef<number | null>(
    null,
  );
  const activeVideoIdRef = useRef<string | null>(null);
  const activeTrackPositionRef = useRef<string | null>(null);
  const isReleasePreviewRef = useRef(false);
  const hasAttemptedRestoreRef = useRef(false);
  const awaitingResumeGestureRef = useRef(false);
  const pendingPlayFromGestureRef = useRef(false);
  const shouldRebuildAlbumQueueRef = useRef(false);
  const similarQueueModeRef = useRef<SimilarQueueMode>(
    createSimilarQueueMode(false),
  );
  const similarQueueGenerationRef = useRef(0);
  const similarQueueFetchInFlightRef = useRef(false);
  const similarQueueTailToastShownRef = useRef(false);
  const queueManuallyExtendedRef = useRef(false);
  const similarQueueSuppressedAfterClearRef = useRef(false);
  const playFromGestureRetryTimeoutsRef = useRef<number[]>([]);
  const playbackIframeRef = useRef<HTMLIFrameElement | null>(null);
  const embedVideoIdRef = useRef<string | null>(null);
  const lastSyncedActiveVideoIdRef = useRef<string | null>(null);
  const isPausedRef = useRef(isPaused);
  const releaseRef = useRef<DiscogsRelease | null>(null);
  const queueRef = useRef(queue);
  const playbackHistoryRef = useRef(playbackHistory);
  const autoPlayOnQueueAddRef = useRef(autoPlayOnQueueAdd);
  const extendQueueWithSimilarReleasesRef = useRef(
    extendQueueWithSimilarReleases,
  );
  const tracksRef = useRef<DiscogsTrack[]>([]);
  const videosRef = useRef<DiscogsVideo[]>([]);
  const activeTrackIndexRef = useRef(activeTrackIndex);
  const releaseDetailIdRef = useRef<number | undefined>(undefined);
  const startPlaybackRef = useRef<(params: StartPlaybackParams) => void>(
    () => undefined,
  );
  const playNextRef = useRef<() => void>(() => undefined);
  const extendQueueTailRef = useRef<() => Promise<boolean>>(async () => false);
  const isPlayingRef = useRef(isPlaying);
  const previewVideoRef = useRef<DiscogsVideo | null>(null);
  const clearPlayFromGestureRetriesRef = useRef<() => void>(() => undefined);
  const embedPlaybackConfirmedRef = useRef(false);
  const embedWatchdogVideoIdRef = useRef<string | null>(null);
  const lastEmbedUnavailableSkipAtMsRef = useRef<number | null>(null);
  const embedWatchdogLoadingRearmCountRef = useRef(0);
  const markEmbedTrackSwitchGraceRef = useRef<() => void>(() => undefined);
  const armEmbedStartWatchdogRef = useRef<() => void>(() => undefined);
  const clearPlaybackVideoUiLoadingRef = useRef<() => void>(() => undefined);
  const resolveEmbedWatchdogDelayMsRef = useRef(() =>
    resolvePlaybackEmbedUnavailableWatchdogMs(),
  );
  resolveEmbedWatchdogDelayMsRef.current = () =>
    resolvePlaybackEmbedUnavailableWatchdogDelayMs({
      nowMs: Date.now(),
      lastUnavailableSkipAtMs: lastEmbedUnavailableSkipAtMsRef.current,
    });
  const embedStartWatchdogRef = useRef(
    createEmbedPlaybackStartWatchdog({
      resolveDelayMs: () => resolveEmbedWatchdogDelayMsRef.current(),
      schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
      cancel: (timeoutId) => {
        window.clearTimeout(timeoutId);
      },
    }),
  );
  const recoverPlaybackAfterTabVisibleRef = useRef<(() => void) | null>(null);
  const embedWatchdogAfterTabVisibleTimeoutRef = useRef<number | null>(null);
  const resolveSkipContextRef = useRef<() => PlaybackSkipSentryContext>(
    () => ({}),
  );
  const embedUnavailableSkipHandlerRef = useRef(
    createPlaybackEmbedUnavailableSkipHandler({
      appendSkip: appendPlaybackSkipAndSchedule,
      resolveSkipDisplay: () =>
        resolvePlaybackSkipLogDisplay({
          release: releaseRef.current,
          tracks: tracksRef.current,
          activeTrackIndex: activeTrackIndexRef.current,
          previewVideo: previewVideoRef.current,
        }),
      resolveSkipContext: () => resolveSkipContextRef.current(),
      isSkipAllowed: () => isPlayingRef.current && !isPausedRef.current,
      onBeforeSkip: () => {
        embedStartWatchdogRef.current.disarm();
        embedPlaybackConfirmedRef.current = false;
        embedWatchdogVideoIdRef.current = null;
        embedWatchdogLoadingRearmCountRef.current = 0;
        lastEmbedUnavailableSkipAtMsRef.current = Date.now();
        markEmbedTrackSwitchGraceRef.current();
        clearPlaybackVideoUiLoadingRef.current();
        clearPlayFromGestureRetriesRef.current();
        pendingPlayFromGestureRef.current = false;
      },
    }),
  );
  const onYoutubeEmbedPlaybackErrorRef = useRef<(errorCode: number) => void>(
    () => undefined,
  );
  autoPlayOnQueueAddRef.current = autoPlayOnQueueAdd;
  extendQueueWithSimilarReleasesRef.current = extendQueueWithSimilarReleases;
  syncPlaybackSessionRefs(session, {
    release: releaseRef,
    queue: queueRef,
    playbackHistory: playbackHistoryRef,
    activeTrackIndex: activeTrackIndexRef,
    previewVideo: previewVideoRef,
    isPlaying: isPlayingRef,
    isPaused: isPausedRef,
  });

  const {
    abortUnresolvedPlayback,
    maybePushCurrentToHistory,
    persistPlaybackSession,
    prependCurrentToUpcoming,
    setUpcomingQueue,
    tryAutoStartOnEmptyQueue,
    updateUpcomingQueue,
  } = useReleasePlaybackQueueCoordination({
    autoPlayOnQueueAddRef,
    dispatchSession,
    embedVideoIdRef,
    activeVideoIdRef,
    isPlayingRef,
    lastSyncedActiveVideoIdRef,
    previewVideoRef,
    queueRef,
    releaseRef,
    sessionQueue: session.queue,
    activeTrackIndexRef,
    tracksRef,
    setEmbedVideoId,
    setShouldAutoplayEmbed,
  });

  usePersistPlaybackSessionOnQueueChange({
    sessionQueue: session.queue,
    persistPlaybackSession,
  });

  const { extendQueueTail, maybeExtendQueueTail, isSimilarQueueLoading } =
    useReleasePlaybackSimilarQueue({
      queryClient,
      allReleases,
      updateUpcomingQueue,
      refs: {
        queueRef,
        previewVideoRef,
        releaseRef,
        tracksRef,
        activeTrackIndexRef,
        similarQueueModeRef,
        similarQueueGenerationRef,
        similarQueueFetchInFlightRef,
        similarQueueTailToastShownRef,
        queueManuallyExtendedRef,
        extendQueueWithSimilarReleasesRef,
        similarQueueSuppressedAfterClearRef,
      },
    });

  const {
    isLoading,
    playbackMatchIndex,
    releaseDetailId,
    releaseId,
    tracks,
    videos,
  } = useReleasePlaybackReleaseDetail({
    release,
    isPlaying,
    tracksRef,
    videosRef,
    releaseDetailIdRef,
  });

  const activeTrack = tracks[activeTrackIndex] ?? null;

  const activeVideo = useMemo(
    () =>
      resolveActivePlaybackVideo({
        previewVideo,
        activeTrack,
        videos,
        playbackMatchIndex,
      }),
    [activeTrack, playbackMatchIndex, previewVideo, videos],
  );

  const isReleasePreview = previewVideo !== null;
  isReleasePreviewRef.current = isReleasePreview;

  const activeTrackPosition = resolveActiveTrackPosition({
    isReleasePreview,
    trackPosition: activeTrack?.position ?? null,
  });
  activeTrackPositionRef.current = activeTrackPosition;

  const playbackYoutubeOverrideTrackKeys = useMemo(() => {
    if (!(release && activeTrackPosition)) {
      return [] as string[];
    }

    return [buildTrackKey(release.instance_id, activeTrackPosition)];
  }, [activeTrackPosition, release]);

  const userYoutubeOverrides = usePlaybackTrackYoutubeOverrides({
    userId: authState.userId,
    queue: session.queue,
    additionalTrackKeys: playbackYoutubeOverrideTrackKeys,
  });
  const userYoutubeOverridesRef = useRef(userYoutubeOverrides);
  userYoutubeOverridesRef.current = userYoutubeOverrides;

  const matchedActiveVideoId = resolveActiveVideoId(activeVideo);
  const matchedActiveVideoIdRef = useRef<string | null>(null);
  matchedActiveVideoIdRef.current = matchedActiveVideoId;

  const activeVideoId = useMemo(
    () =>
      resolvePresentationActiveVideoId(
        matchedActiveVideoId,
        release && activeTrack
          ? userYoutubeOverrides.get(
              buildTrackKey(release.instance_id, activeTrack.position),
            )
          : undefined,
        embedVideoId,
      ),
    [
      activeTrack,
      embedVideoId,
      matchedActiveVideoId,
      release,
      userYoutubeOverrides,
    ],
  );
  activeVideoIdRef.current = activeVideoId;

  const activeTrackStats = useMemo(
    () => mergeTrackStatsFromQueryCache(queryClient, authState.userId),
    [authState.userId, queryClient],
  );

  const activeTrackKey =
    release && activeTrack
      ? buildTrackKey(release.instance_id, activeTrack.position)
      : null;

  const activeTrackResolvedOverrideId =
    activeTrackKey != null
      ? userYoutubeOverrides.get(activeTrackKey)?.trim()
      : undefined;

  const activeTrackAwaitingStatsOverride = useMemo(
    () =>
      isAwaitingTrackStatsForYoutubeOverride({
        isPlaying,
        userId: authState.userId,
        trackKey: activeTrackKey,
        resolvedOverrideId: activeTrackResolvedOverrideId,
        stats: activeTrackStats,
      }),
    [
      activeTrackKey,
      activeTrackResolvedOverrideId,
      activeTrackStats,
      authState.userId,
      isPlaying,
    ],
  );

  const activeTrackAwaitingStatsOverrideRef = useRef(
    activeTrackAwaitingStatsOverride,
  );
  activeTrackAwaitingStatsOverrideRef.current =
    activeTrackAwaitingStatsOverride;

  resolveSkipContextRef.current = () => {
    const activeRelease = releaseRef.current;
    const activeTracks = tracksRef.current;
    const activeIndex = activeTrackIndexRef.current;
    const activeTrackForSkip = activeTracks[activeIndex];
    const trackPosition = activeTrackForSkip?.position?.trim() ?? "";
    const trackKey =
      activeRelease && trackPosition
        ? buildTrackKey(activeRelease.instance_id, trackPosition)
        : undefined;

    return resolvePlaybackSkipSentryDetails(
      definedProps({
        release: activeRelease,
        tracks: activeTracks,
        activeTrackIndex: activeIndex,
        previewVideo: previewVideoRef.current,
        youtubeVideoId:
          embedWatchdogVideoIdRef.current ?? embedVideoIdRef.current,
        userYoutubeOverrideId: trackKey
          ? userYoutubeOverridesRef.current.get(trackKey)?.trim()
          : undefined,
        discogsMatchedYoutubeId: matchedActiveVideoIdRef.current,
        watchdogMs: resolvePlaybackEmbedUnavailableWatchdogMs(),
        connectionQuality: classifyNetworkConnectionQuality(
          getNavigatorNetworkInformation(),
        ),
      }),
    );
  };

  const activeTrackHasYoutubeOverride = useMemo(
    () =>
      resolveActiveTrackHasYoutubeOverride({
        resolvedOverrideId: activeTrackResolvedOverrideId,
        isAwaitingStatsOverride: activeTrackAwaitingStatsOverride,
        embedVideoId,
        matchedVideoId: matchedActiveVideoId,
      }),
    [
      activeTrackAwaitingStatsOverride,
      activeTrackResolvedOverrideId,
      embedVideoId,
      matchedActiveVideoId,
    ],
  );

  const activePlaybackTitle = resolveActivePlaybackTitle({
    isReleasePreview,
    previewTitle: activeVideo?.title ?? null,
    trackTitle: activeTrack?.title ?? null,
  });

  const isMiniPlayerVisible = selectIsMiniPlayerVisible(session);

  const playbackVideoId = useMemo(
    () =>
      resolvePlaybackVideoId({
        transitionTargetVideoId: playbackVideoTransitionTargetId,
        pendingTrackPosition,
        pendingPreviewVideoUri,
        embedVideoId,
        activeVideoId,
      }),
    [
      activeVideoId,
      embedVideoId,
      pendingPreviewVideoUri,
      pendingTrackPosition,
      playbackVideoTransitionTargetId,
    ],
  );

  const setPlaybackVideoTransitionTargetIdWithRef = useCallback(
    (videoId: string | null) => {
      playbackVideoTransitionTargetIdRef.current = videoId;
      setPlaybackVideoTransitionTargetId(videoId);
    },
    [],
  );

  const beginPlaybackVideoUiLoading = useCallback(() => {
    isPlaybackVideoUiLoadingRef.current = true;
    playbackVideoUiLoadingEmbedLoadStartedAtMsRef.current = null;
    setIsPlaybackVideoUiLoading(true);
  }, []);

  const setPlaybackVideoUiLoadingTargetId = useCallback(
    (videoId: string | null) => {
      playbackVideoUiLoadingTargetVideoIdRef.current = videoId;
    },
    [],
  );

  const clearPlaybackVideoUiLoading = useCallback(() => {
    isPlaybackVideoUiLoadingRef.current = false;
    playbackVideoUiLoadingTargetVideoIdRef.current = null;
    playbackVideoUiLoadingEmbedLoadStartedAtMsRef.current = null;
    setIsPlaybackVideoUiLoading(false);
  }, []);

  clearPlaybackVideoUiLoadingRef.current = clearPlaybackVideoUiLoading;

  useEffect(() => {
    if (
      !shouldClearPlaybackVideoTransition({
        transitionTargetVideoId: playbackVideoTransitionTargetId,
        activeVideoId,
        pendingTrackPosition,
        pendingPreviewVideoUri,
      })
    ) {
      return;
    }

    setPlaybackVideoTransitionTargetIdWithRef(null);
  }, [
    activeVideoId,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    playbackVideoTransitionTargetId,
    setPlaybackVideoTransitionTargetIdWithRef,
  ]);

  useEffect(() => {
    if (!isPlaybackVideoUiLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      isPlaybackVideoUiLoadingRef.current = false;
      playbackVideoUiLoadingTargetVideoIdRef.current = null;
      playbackVideoUiLoadingEmbedLoadStartedAtMsRef.current = null;
      setIsPlaybackVideoUiLoading(false);
    }, PLAYBACK_VIDEO_UI_LOADING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPlaybackVideoUiLoading]);

  const isPlaybackVideoLoading = isPlaybackVideoUiLoading;
  const isPlaybackVideoTransitionPending =
    playbackVideoTransitionTargetId !== null;

  const isPlaybackReady = resolveIsPlaybackReady({
    isPlaying,
    playbackVideoId,
  });

  const canPlayPrevious = isPlaybackReady && playbackHistory.length > 0;
  const canPlayNext = isPlaybackReady && queue.length > 0;

  const handlePlaybackEnded = useMemo(
    () =>
      createPlaybackEndedAdvanceHandler({
        isPlayingRef,
        queueRef,
        extendQueueTailRef,
        playNextRef,
      }),
    [],
  );

  const forwardYoutubeEmbedPlaybackError = useCallback((errorCode: number) => {
    onYoutubeEmbedPlaybackErrorRef.current(errorCode);
  }, []);

  const confirmEmbedPlayback = useCallback(() => {
    embedPlaybackConfirmedRef.current = true;
    embedWatchdogLoadingRearmCountRef.current = 0;
    embedStartWatchdogRef.current.disarm();
  }, []);

  const {
    clearPlayFromGestureRetries,
    schedulePlayFromGestureAttempts,
    syncEmbedToVideoId,
    syncEmbedForQueueItem,
    resolveQueueItemEmbedVideoId,
    prefetchQueueItemEmbed,
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    notifyImperativeEmbedLoadStarted,
    resumePlaybackFromGesture,
    recoverPlaybackAfterTabVisible,
    markEmbedTrackSwitchGrace,
  } = useReleasePlaybackYoutubeEmbed({
    queryClient,
    dispatchSession,
    refs: {
      playbackIframeRef,
      embedVideoIdRef,
      lastSyncedActiveVideoIdRef,
      isPlayingRef,
      isPausedRef,
      activeVideoIdRef,
      isPlaybackVideoUiLoadingRef,
      pendingPlayFromGestureRef,
      playbackVideoTransitionTargetIdRef,
      playbackVideoUiLoadingTargetVideoIdRef,
      playbackVideoUiLoadingEmbedLoadStartedAtMsRef,
      embedWatchdogVideoIdRef,
      playFromGestureRetryTimeoutsRef,
      releaseRef,
      tracksRef,
      videosRef,
    },
    isPlaying,
    isPaused,
    isPlaybackReady,
    isPlaybackEmbedMounted,
    activeVideoId,
    matchedActiveVideoId,
    pendingTrackPosition,
    pendingPreviewVideoUri,
    releaseId,
    releaseDetailId,
    setEmbedVideoId,
    setShouldAutoplayEmbed,
    setIsPlaybackEmbedMounted,
    clearPlaybackVideoUiLoading,
    onPlaybackEnded: handlePlaybackEnded,
    onYoutubeEmbedPlaybackError: forwardYoutubeEmbedPlaybackError,
    onEmbedPlaybackConfirmed: confirmEmbedPlayback,
    onEmbedTransportPaused: () => {
      embedStartWatchdogRef.current.disarm();
    },
    userYoutubeOverridesRef,
  });

  clearPlayFromGestureRetriesRef.current = clearPlayFromGestureRetries;
  recoverPlaybackAfterTabVisibleRef.current = recoverPlaybackAfterTabVisible;
  markEmbedTrackSwitchGraceRef.current = markEmbedTrackSwitchGrace;

  const advanceQueueAfterSkip = useCallback(() => {
    playNextRef.current();
  }, []);

  const runEmbedUnavailableSkipIfUnconfirmed = useCallback(() => {
    const outcome = resolveEmbedUnavailableWatchdogOutcome({
      embedPlaybackConfirmed: embedPlaybackConfirmedRef.current,
      watchdogVideoId: embedWatchdogVideoIdRef.current,
      embedVideoId: embedVideoIdRef.current,
      isPlaybackVideoUiLoading: isPlaybackVideoUiLoadingRef.current,
      rearmCount: embedWatchdogLoadingRearmCountRef.current,
    });

    if (outcome === "defer") {
      return;
    }

    if (outcome === "rearm") {
      embedWatchdogLoadingRearmCountRef.current += 1;
      armEmbedStartWatchdogRef.current();
      return;
    }

    embedWatchdogLoadingRearmCountRef.current = 0;
    embedUnavailableSkipHandlerRef.current.handleFailure(
      PLAYBACK_EMBED_UNAVAILABLE_FALLBACK,
      advanceQueueAfterSkip,
    );
  }, [advanceQueueAfterSkip]);

  const armEmbedStartWatchdog = useCallback(() => {
    if (!shouldArmPlaybackEmbedStartWatchdog(document.visibilityState)) {
      return;
    }

    embedStartWatchdogRef.current.disarm();
    embedStartWatchdogRef.current.arm(runEmbedUnavailableSkipIfUnconfirmed);
  }, [runEmbedUnavailableSkipIfUnconfirmed]);

  armEmbedStartWatchdogRef.current = armEmbedStartWatchdog;

  useEffect(() => {
    const clearEmbedWatchdogAfterTabVisibleTimeout = () => {
      if (embedWatchdogAfterTabVisibleTimeoutRef.current === null) {
        return;
      }

      window.clearTimeout(embedWatchdogAfterTabVisibleTimeoutRef.current);
      embedWatchdogAfterTabVisibleTimeoutRef.current = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        embedStartWatchdogRef.current.disarm();
        clearEmbedWatchdogAfterTabVisibleTimeout();
        return;
      }

      recoverPlaybackAfterTabVisibleRef.current?.();

      if (
        !shouldDeferEmbedStartWatchdogUntilAfterTabVisibleRecovery({
          visibilityState: document.visibilityState,
          isPlaying: isPlayingRef.current,
          isPaused: isPausedRef.current,
          embedPlaybackConfirmed: embedPlaybackConfirmedRef.current,
        })
      ) {
        return;
      }

      clearEmbedWatchdogAfterTabVisibleTimeout();
      embedWatchdogAfterTabVisibleTimeoutRef.current = window.setTimeout(() => {
        embedWatchdogAfterTabVisibleTimeoutRef.current = null;

        if (document.visibilityState !== "visible") {
          return;
        }

        if (embedPlaybackConfirmedRef.current) {
          return;
        }

        if (!isPlayingRef.current || isPausedRef.current) {
          return;
        }

        armEmbedStartWatchdog();
      }, EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearEmbedWatchdogAfterTabVisibleTimeout();
    };
  }, [armEmbedStartWatchdog]);

  onYoutubeEmbedPlaybackErrorRef.current = (errorCode) => {
    embedUnavailableSkipHandlerRef.current.handleFailure(
      errorCode,
      advanceQueueAfterSkip,
    );
  };

  const notifyPlaybackVideoLoadStarted = useCallback(
    (videoId?: string) => {
      notifyImperativeEmbedLoadStarted();

      const resolvedVideoId = videoId ?? embedVideoIdRef.current;

      if (
        embedPlaybackConfirmedRef.current &&
        resolvedVideoId !== null &&
        resolvedVideoId === embedWatchdogVideoIdRef.current
      ) {
        return;
      }

      embedWatchdogVideoIdRef.current = resolvedVideoId;
      embedPlaybackConfirmedRef.current = false;
      embedWatchdogLoadingRearmCountRef.current = 0;

      const deferWatchdogForPendingOverrideStats =
        activeTrackAwaitingStatsOverrideRef.current &&
        matchedActiveVideoIdRef.current === null;

      if (
        !(isPausedRef.current || deferWatchdogForPendingOverrideStats) &&
        resolvedVideoId?.trim()
      ) {
        armEmbedStartWatchdog();
      }
    },
    [armEmbedStartWatchdog, notifyImperativeEmbedLoadStarted],
  );

  const notifyPlaybackVideoPresentationReady = useCallback(() => {
    notifyImperativeEmbedLoadStarted();
    clearPlaybackVideoUiLoading();
    confirmEmbedPlayback();
  }, [
    clearPlaybackVideoUiLoading,
    confirmEmbedPlayback,
    notifyImperativeEmbedLoadStarted,
  ]);

  const settleSameUploadQueueAdvance = notifyPlaybackVideoPresentationReady;

  const prepareQueueAdvancePlayback = useCallback(
    (item: PlaybackQueueItem | null) => {
      const preparedEmbedVideoId = item
        ? resolveQueueItemEmbedVideoId(item)
        : null;
      const replaySameTrack =
        item !== null &&
        isQueueItemReplayOfActiveSession(item, {
          release: releaseRef.current,
          activeTrackPosition: activeTrackPositionRef.current,
          isReleasePreview: isReleasePreviewRef.current,
          activeVideoId: activeVideoIdRef.current,
        });

      if (
        shouldBeginPlaybackVideoUiLoading({
          hasQueueItem: item != null,
          preparedEmbedVideoId,
          activeVideoId: activeVideoIdRef.current,
          replaySameTrack,
          forceEmbedReload: replaySameTrack,
        })
      ) {
        beginPlaybackVideoUiLoading();
      }
    },
    [beginPlaybackVideoUiLoading, resolveQueueItemEmbedVideoId],
  );

  const resetPlaybackSkipState = useCallback(() => {
    embedStartWatchdogRef.current.disarm();
    embedUnavailableSkipHandlerRef.current.resetDedupe();
  }, []);

  useEffect(() => {
    return () => {
      clearPlayFromGestureRetries();
      embedStartWatchdogRef.current.disarm();
    };
  }, [clearPlayFromGestureRetries]);

  const {
    startPlayback,
    startReleasePreview,
    addToQueue,
    addPreviewToQueue,
    playQueueAtIndex,
    removeFromQueue,
    reorderQueue,
    playNext,
    playPrevious,
    stopPlayback,
    clearQueue,
    removeAlbumTracksFromQueue,
  } = useReleasePlaybackQueueActions({
    dispatchSession,
    setShouldAutoplayEmbed,
    setIsPlaybackEmbedMounted,
    setPlaybackVideoTransitionTargetId:
      setPlaybackVideoTransitionTargetIdWithRef,
    setPlaybackVideoUiLoadingTargetId,
    clearPlaybackVideoUiLoading,
    beginPlaybackVideoUiLoading,
    markEmbedTrackSwitchGrace,
    prepareQueueAdvancePlayback,
    settleSameUploadQueueAdvance,
    setEmbedVideoId,
    clearPlayFromGestureRetries,
    syncEmbedToVideoId,
    syncEmbedForQueueItem,
    prefetchQueueItemEmbed,
    setUpcomingQueue,
    updateUpcomingQueue,
    maybePushCurrentToHistory,
    prependCurrentToUpcoming,
    tryAutoStartOnEmptyQueue,
    extendQueueTail,
    playNextRef,
    extendQueueTailRef,
    startPlaybackRef,
    resetPlaybackSkipState,
    refs: {
      awaitingResumeGestureRef,
      pendingPlayFromGestureRef,
      shouldRebuildAlbumQueueRef,
      similarQueueModeRef,
      similarQueueGenerationRef,
      extendQueueWithSimilarReleasesRef,
      similarQueueTailToastShownRef,
      queueManuallyExtendedRef,
      similarQueueSuppressedAfterClearRef,
      releaseRef,
      queueRef,
      playbackHistoryRef,
      isPlayingRef,
      isPausedRef,
      releaseDetailIdRef,
      tracksRef,
      lastSyncedActiveVideoIdRef,
      activeVideoIdRef,
      embedVideoIdRef,
      activeTrackPositionRef,
      isReleasePreviewRef,
    },
  });

  useReleasePlaybackQueueWarmup({
    queryClient,
    isPlaying,
    queue,
  });

  useReleasePlaybackPendingResolution({
    abortUnresolvedPlayback,
    activeTrackIndex,
    activeVideoId,
    embedVideoId,
    awaitingResumeGestureRef,
    dispatchSession,
    isLoading,
    isPlaying,
    isReleasePreview,
    maybeExtendQueueTail,
    upcomingQueueLength: queue.length,
    allReleasesLength: allReleases.length,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    previewVideo,
    release,
    releaseDetailId,
    releaseId,
    setUpcomingQueue,
    shouldRebuildAlbumQueueRef,
    tracks,
    videos,
    activeTrackHasYoutubeOverride,
  });

  const togglePlaybackBase = useReleasePlaybackTransportToggle({
    isPaused,
    dispatchSession,
    playbackIframeRef,
    awaitingResumeGestureRef,
    pendingPlayFromGestureRef,
    schedulePlayFromGestureAttempts,
    clearPlayFromGestureRetries,
  });

  const togglePlayback = useCallback(() => {
    const resumingFromPause = isPaused;

    togglePlaybackBase();

    if (resumingFromPause) {
      if (release) {
        const item = buildCurrentQueueItem({
          release,
          previewVideo,
          activeTrack,
        });

        if (item) {
          recordTrackPlayFromQueueItem(
            item,
            activeVideoIdRef.current ?? embedVideoIdRef.current,
          );
        }
      }

      if (!embedPlaybackConfirmedRef.current) {
        armEmbedStartWatchdog();
      }

      return;
    }

    embedStartWatchdogRef.current.disarm();
  }, [
    activeTrack,
    armEmbedStartWatchdog,
    isPaused,
    previewVideo,
    release,
    togglePlaybackBase,
  ]);

  usePersistPlaybackSessionWhilePlaying({
    isPlaying,
    release,
    pendingTrackPosition,
    activeTrackPosition,
    isReleasePreview,
    persistPlaybackSession,
  });

  useRestorePlaybackSessionFromStorage({
    isPlaying,
    isCheckingAuth,
    isAuthenticated,
    fetchingCollection,
    collection,
    allReleases,
    hasMoreCollectionPages,
    hasAttemptedRestoreRef,
    queueManuallyExtendedRef,
    setUpcomingQueue,
    startPlaybackRef,
  });

  const isQueueBuilding =
    isSimilarQueueLoading ||
    (queue.length === 0 && pendingTrackPosition !== null);

  const stateValue = useMemo(
    (): ReleasePlaybackState => ({
      release,
      tracks,
      videos,
      queue,
      autoPlayOnQueueAdd,
      extendQueueWithSimilarReleases,
      activeTrackIndex,
      activeTrackPosition,
      activeTrack,
      activeVideoId,
      embedVideoId,
      playbackVideoId,
      activePlaybackTitle,
      isReleasePreview,
      isPlaying,
      isPaused,
      isMiniPlayerVisible,
      shouldAutoplayEmbed,
      isPlaybackEmbedMounted,
      isPlaybackReady,
      canPlayPrevious,
      canPlayNext,
      isLoading,
      isQueueBuilding,
      isPlaybackVideoLoading,
      isPlaybackVideoTransitionPending,
    }),
    [
      release,
      tracks,
      videos,
      queue,
      autoPlayOnQueueAdd,
      extendQueueWithSimilarReleases,
      activeTrackIndex,
      activeTrackPosition,
      activeTrack,
      activeVideoId,
      embedVideoId,
      playbackVideoId,
      activePlaybackTitle,
      isReleasePreview,
      isPlaying,
      isPaused,
      isMiniPlayerVisible,
      shouldAutoplayEmbed,
      isPlaybackEmbedMounted,
      isPlaybackReady,
      canPlayPrevious,
      canPlayNext,
      isLoading,
      isQueueBuilding,
      isPlaybackVideoLoading,
      isPlaybackVideoTransitionPending,
    ],
  );

  const actionsValue = useMemo(
    (): ReleasePlaybackActions => ({
      startPlayback,
      startReleasePreview,
      addToQueue,
      addPreviewToQueue,
      removeAlbumTracksFromQueue,
      removeFromQueue,
      reorderQueue,
      playQueueAtIndex,
      playNext,
      playPrevious,
      togglePlayback,
      registerPlaybackIframe,
      notifyPlaybackIframeLoaded,
      notifyPlaybackVideoLoadStarted,
      notifyPlaybackVideoPresentationReady,
      resumePlaybackFromGesture,
      clearQueue,
      stopPlayback,
    }),
    [
      startPlayback,
      startReleasePreview,
      addToQueue,
      addPreviewToQueue,
      removeAlbumTracksFromQueue,
      removeFromQueue,
      reorderQueue,
      playQueueAtIndex,
      playNext,
      playPrevious,
      togglePlayback,
      registerPlaybackIframe,
      notifyPlaybackIframeLoaded,
      notifyPlaybackVideoLoadStarted,
      notifyPlaybackVideoPresentationReady,
      resumePlaybackFromGesture,
      clearQueue,
      stopPlayback,
    ],
  );

  return {
    actionsValue,
    isMiniPlayerVisible,
    queue,
    stateValue,
  };
};
