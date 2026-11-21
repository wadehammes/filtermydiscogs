import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  ReleasePlaybackActionsContext,
  ReleasePlaybackEmbedProgressContext,
  ReleasePlaybackStateContext,
} from "src/context/releasePlaybackContexts";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type {
  ReleasePlaybackActions,
  ReleasePlaybackState,
} from "src/types/releasePlaybackContext.types";
import type { PlaybackEmbedProgress } from "src/utils/playbackEmbedProgress";
import { render } from "test-utils";
import { ReleaseMiniPlayerDigScrub } from "./ReleaseMiniPlayerDigScrub.component";
import { ReleaseMiniPlayerVolumePopover } from "./ReleaseMiniPlayerVolumePopover.component";

export type ReleaseMiniPlayerDigControlsRenderProps = {
  actions: ReleasePlaybackActions;
  disabled?: boolean | undefined;
  embedProgress: PlaybackEmbedProgress | null;
  state?: Partial<ReleasePlaybackState> | undefined;
};

const defaultDigControlsPlaybackState = (
  overrides: Partial<ReleasePlaybackState> = {},
): ReleasePlaybackState => ({
  release: null,
  tracks: [],
  videos: [],
  queue: [],
  autoPlayOnQueueAdd: true,
  extendQueueWithSimilarReleases: false,
  activeTrackIndex: 0,
  activeTrackPosition: null,
  activeTrack: null,
  activeVideoId: null,
  embedVideoId: null,
  playbackVideoId: "test-video",
  activePlaybackTitle: null,
  activePlaybackArtist: null,
  isReleasePreview: false,
  isPlaying: true,
  isPaused: false,
  isMiniPlayerVisible: true,
  shouldAutoplayEmbed: true,
  isPlaybackEmbedMounted: true,
  playbackEmbedRemountNonce: 0,
  isPlaybackReady: true,
  canPlayPrevious: false,
  canPlayNext: false,
  isLoading: false,
  isQueueBuilding: false,
  isSimilarQueueLoading: false,
  isCollectionRadioQueueLoading: false,
  queueAutopopulateSource: null,
  isPlaybackVideoLoading: false,
  isPlaybackVideoTransitionPending: false,
  isPlaybackDockMuted: false,
  ...overrides,
});

export class ReleaseMiniPlayerDigControlsPageObject extends BasePageObject {
  public scrubTestId = "fmdReleaseMiniPlayerDigScrub";
  public volumePopoverTestId = "fmdReleaseMiniPlayerVolumePopover";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private digControlsProviders({
    actions,
    embedProgress,
    state,
    children,
  }: ReleaseMiniPlayerDigControlsRenderProps & {
    children: ReactNode;
  }) {
    return (
      <ReleasePlaybackStateContext.Provider
        value={defaultDigControlsPlaybackState(state)}
      >
        <ReleasePlaybackActionsContext.Provider value={actions}>
          <ReleasePlaybackEmbedProgressContext.Provider
            value={{ embedProgress }}
          >
            {children}
          </ReleasePlaybackEmbedProgressContext.Provider>
        </ReleasePlaybackActionsContext.Provider>
      </ReleasePlaybackStateContext.Provider>
    );
  }

  renderDigScrub(props: ReleaseMiniPlayerDigControlsRenderProps): RenderResult {
    const { disabled, ...providerProps } = props;

    return render(
      this.digControlsProviders({
        ...providerProps,
        children: (
          <ReleaseMiniPlayerDigScrub
            {...(disabled !== undefined ? { disabled } : {})}
          />
        ),
      }),
    );
  }

  renderVolumePopover(
    props: ReleaseMiniPlayerDigControlsRenderProps,
  ): RenderResult {
    const { disabled, ...providerProps } = props;

    return render(
      this.digControlsProviders({
        ...providerProps,
        children: (
          <ReleaseMiniPlayerVolumePopover
            {...(disabled !== undefined ? { disabled } : {})}
          />
        ),
      }),
    );
  }
}
