"use client";

import classNames from "classnames";
import Link from "next/link";
import { useMemo } from "react";
import Button from "src/components/Button/Button.component";
import { PlaybackScrollSpacer } from "src/components/PlaybackScrollSpacer/PlaybackScrollSpacer.component";
import playlistStyles from "src/components/PublicPlaylist/PublicPlaylist.module.css";
import { PublicPlaylistSummaryHero } from "src/components/PublicPlaylist/PublicPlaylistSummaryHero.component";
import heroStyles from "src/components/PublicPlaylist/PublicPlaylistSummaryHero.module.css";
import { PublicPlaylistSummarySecondaryMetaLines } from "src/components/PublicPlaylist/PublicPlaylistSummarySecondaryMetaLines.component";
import { PublicPlaylistTrackItem } from "src/components/PublicPlaylistTrackItem/PublicPlaylistTrackItem.component";
import { PublicReleaseModal } from "src/components/PublicReleaseModal/PublicReleaseModal.component";
import { PublicReleaseHeroActions } from "src/components/PublicReleasePage/PublicReleaseHeroActions.component";
import { PublicReleaseNoPlayableTracksNote } from "src/components/PublicReleasePage/PublicReleaseNoPlayableTracksNote.component";
import { usePublicReleaseListenPageState } from "src/components/PublicReleasePage/usePublicReleaseListenPageState.hook";
import { PublicShareMarketingSection } from "src/components/PublicShareMarketingSection/PublicShareMarketingSection.component";
import { PublicSharePlaybackShell } from "src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component";
import tracklistStyles from "src/components/ReleaseTracklist/ReleaseTracklist.module.css";
import { PUBLIC_RELEASE_LISTEN_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { TABLET_UP_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import { definedProps } from "src/utils/definedProps";
import styles from "./PublicReleasePage.module.css";

const pulseSurface = skeletonPulseStyles.pulsesurface;

export interface PublicReleasePageProps {
  releaseId: string;
  initialDiscogsReleaseDetail?: DiscogsReleaseDetail;
}

export const PublicReleasePageSkeleton = () => (
  <div className={playlistStyles.container}>
    <div className={playlistStyles.content}>
      <div className={playlistStyles.publicShareStack}>
        <section className={playlistStyles.playlistWorkspace}>
          <div
            className={classNames(
              heroStyles.aside,
              playlistStyles.playlistAside,
            )}
          >
            <div className={heroStyles.heroPrimary}>
              <div className={heroStyles.coverFrame}>
                <div
                  className={classNames(pulseSurface, styles.skeletonCover)}
                  aria-hidden
                />
              </div>
              <div className={heroStyles.copyDetails}>
                <div
                  className={classNames(pulseSurface, styles.skeletonTitle)}
                  aria-hidden
                />
                <div
                  className={classNames(pulseSurface, styles.skeletonMeta)}
                  aria-hidden
                />
                <div
                  className={classNames(pulseSurface, styles.skeletonMeta)}
                  aria-hidden
                />
              </div>
            </div>
            <div className={heroStyles.releaseHeroActionRow}>
              <div
                className={classNames(pulseSurface, styles.skeletonButton)}
                aria-hidden
              />
              <div
                className={classNames(pulseSurface, styles.skeletonButton)}
                aria-hidden
              />
            </div>
          </div>
          <div className={playlistStyles.playlistMain}>
            <div
              className={classNames(pulseSurface, styles.skeletonMeta)}
              style={{ maxWidth: "8rem" }}
              aria-hidden
            />
            <div
              className={classNames(
                tracklistStyles.tracklist,
                playlistStyles.tracklistPanel,
                styles.skeletonTrackPanel,
              )}
            >
              <div className={styles.skeletonTrackRows}>
                {Array.from({ length: 6 }).map((_, rowIndex) => (
                  <div
                    key={`sk-row-${rowIndex}`}
                    className={classNames(
                      pulseSurface,
                      styles.skeletonTrackRow,
                    )}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
        <PublicShareMarketingSection />
      </div>
      <PlaybackScrollSpacer />
    </div>
  </div>
);

export const PublicReleaseClient = ({
  releaseId,
  initialDiscogsReleaseDetail,
}: PublicReleasePageProps) => {
  const {
    collectionRelease,
    coverHeroUrl,
    detail,
    discogsUri,
    error,
    handleCloseModal,
    handlePlayAll,
    handlePlayTrack,
    handleReleaseClick,
    heroMetaLine,
    is404Error,
    isError,
    isFetching,
    isPendingSkeleton,
    communityRating,
    orderedTracks,
    playableTrackCount,
    refetch,
    secondaryMetaLines,
    selectedRelease,
  } = usePublicReleaseListenPageState({
    releaseId,
    ...definedProps({ initialDiscogsReleaseDetail }),
  });

  const trackCount = orderedTracks.length;
  const isTabletUp = useMediaQuery(TABLET_UP_MEDIA_QUERY);
  const heroSecondaryMetaLines = isTabletUp ? secondaryMetaLines : undefined;
  const heroCommunityRating = isTabletUp ? communityRating : undefined;
  const showSecondaryMetaBelowTracklist =
    !isTabletUp && (secondaryMetaLines.length > 0 || communityRating !== null);
  const showNoPlayableTracksNote = trackCount > 0 && playableTrackCount === 0;

  const heroActions = useMemo(
    () => (
      <PublicReleaseHeroActions
        discogsUri={discogsUri}
        onPlayAll={handlePlayAll}
        trackCount={playableTrackCount}
      />
    ),
    [discogsUri, handlePlayAll, playableTrackCount],
  );

  if (isPendingSkeleton) {
    return <PublicReleasePageSkeleton />;
  }

  if (is404Error) {
    return (
      <div className={playlistStyles.container}>
        <div className={playlistStyles.content}>
          <div className={playlistStyles.section}>
            <h2 className={playlistStyles.heading}>Release not found</h2>
            <p className={playlistStyles.text}>
              This release does not exist on Discogs, or the link may be wrong.
            </p>
            <p className={playlistStyles.text}>
              <Link href="/" className={playlistStyles.inlineLink}>
                Return to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load release";

    return (
      <div className={playlistStyles.container}>
        <div className={playlistStyles.content}>
          <div className={playlistStyles.section}>
            <h2 className={playlistStyles.heading}>Something went wrong</h2>
            <p className={playlistStyles.text}>{errorMessage}</p>
            <Button
              variant="secondary"
              size="md"
              onPress={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const coverLabel = `${detail.title} cover art`;

  return (
    <>
      <div className={playlistStyles.container}>
        <div className={playlistStyles.content}>
          <div className={playlistStyles.publicShareStack}>
            <section className={playlistStyles.playlistWorkspace}>
              <PublicPlaylistSummaryHero
                className={playlistStyles.playlistAside}
                title={detail.title}
                coverThumbUrls={coverHeroUrl ? [coverHeroUrl] : []}
                coverLayout="single"
                coverLabel={coverLabel}
                metaLine={heroMetaLine}
                actions={heroActions}
                {...definedProps({
                  secondaryMetaLines: heroSecondaryMetaLines,
                  communityRating: heroCommunityRating,
                })}
              />

              <div className={playlistStyles.playlistMain}>
                {trackCount > 0 ? (
                  <>
                    {showNoPlayableTracksNote ? (
                      <PublicReleaseNoPlayableTracksNote />
                    ) : null}
                    <ul
                      className={classNames(
                        tracklistStyles.tracklist,
                        playlistStyles.tracklistPanel,
                      )}
                      aria-label={`${detail.title} tracklist`}
                    >
                      {orderedTracks.map((track, trackIndex) => (
                        <PublicPlaylistTrackItem
                          key={track.track_key}
                          playlistId={releaseId}
                          index={trackIndex + 1}
                          track={track}
                          showTrackVoteControls={false}
                          release={collectionRelease}
                          onReleaseClick={handleReleaseClick}
                          onPlayTrack={handlePlayTrack}
                          requireYoutubeForPlayback
                        />
                      ))}
                    </ul>
                    {showSecondaryMetaBelowTracklist ? (
                      <PublicPlaylistSummarySecondaryMetaLines
                        lines={secondaryMetaLines}
                        communityRating={communityRating}
                        className={
                          heroStyles.releaseSecondaryMetaAfterTracklist
                        }
                      />
                    ) : null}
                  </>
                ) : (
                  <p className={playlistStyles.text}>
                    No playable tracks were returned for this release.
                  </p>
                )}
              </div>
            </section>

            <PublicShareMarketingSection />
          </div>

          <PlaybackScrollSpacer />
        </div>
      </div>
      <PublicReleaseModal
        isOpen={selectedRelease !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
      />
    </>
  );
};

export const PublicReleasePage = ({
  releaseId,
  ...rest
}: PublicReleasePageProps) => (
  <main
    data-testid="fmdPublicReleasePage"
    aria-label={PUBLIC_RELEASE_LISTEN_MAIN_LABEL}
  >
    <PublicSharePlaybackShell>
      <PublicReleaseClient releaseId={releaseId} {...rest} />
    </PublicSharePlaybackShell>
  </main>
);
