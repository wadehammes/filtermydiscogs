"use client";

import classNames from "classnames";
import Link from "next/link";
import { useMemo } from "react";
import Button from "src/components/Button/Button.component";
import buttonStyles from "src/components/Button/Button.module.css";
import { PlaybackScrollSpacer } from "src/components/PlaybackScrollSpacer/PlaybackScrollSpacer.component";
import playlistStyles from "src/components/PublicPlaylist/PublicPlaylist.module.css";
import { PublicPlaylistSummaryHero } from "src/components/PublicPlaylist/PublicPlaylistSummaryHero.component";
import heroStyles from "src/components/PublicPlaylist/PublicPlaylistSummaryHero.module.css";
import { PublicPlaylistTrackItem } from "src/components/PublicPlaylistTrackItem/PublicPlaylistTrackItem.component";
import { PublicReleaseModal } from "src/components/PublicReleaseModal/PublicReleaseModal.component";
import { usePublicReleaseListenPageState } from "src/components/PublicReleasePage/usePublicReleaseListenPageState.hook";
import { PublicShareMarketingSection } from "src/components/PublicShareMarketingSection/PublicShareMarketingSection.component";
import { PublicSharePlaybackShell } from "src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component";
import tracklistStyles from "src/components/ReleaseTracklist/ReleaseTracklist.module.css";
import { PUBLIC_RELEASE_LISTEN_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import PlayIcon from "src/styles/icons/play-thin.svg";
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
            <div className={styles.skeletonActionStack}>
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
    coverThumbUrls,
    detail,
    discogsUri,
    error,
    handleCloseModal,
    handlePlayAll,
    handlePlayTrack,
    handleReleaseClick,
    heroMetaLine,
    heroPrimaryThumbCap,
    is404Error,
    isError,
    isFetching,
    isPendingSkeleton,
    orderedTracks,
    refetch,
    secondaryMetaLines,
    selectedRelease,
  } = usePublicReleaseListenPageState({
    releaseId,
    ...definedProps({ initialDiscogsReleaseDetail }),
  });

  const heroThumbUrls = useMemo(
    () => coverThumbUrls.slice(0, heroPrimaryThumbCap),
    [coverThumbUrls, heroPrimaryThumbCap],
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

  const trackCount = orderedTracks.length;
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
                coverThumbUrls={heroThumbUrls}
                coverLabel={coverLabel}
                metaLine={heroMetaLine}
                secondaryMetaLines={secondaryMetaLines}
                actions={
                  <div className={styles.actionStack}>
                    <Button
                      variant="primary"
                      size="md"
                      className={playlistStyles.playButton}
                      onPress={handlePlayAll}
                      disabled={trackCount === 0}
                    >
                      <span
                        className={playlistStyles.playButtonIcon}
                        aria-hidden
                      >
                        <PlayIcon />
                      </span>
                      Play All
                    </Button>
                    {discogsUri ? (
                      <Link
                        href={discogsUri}
                        className={classNames(
                          buttonStyles.button,
                          buttonStyles.secondary,
                          buttonStyles.md,
                          playlistStyles.playButton,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Discogs
                      </Link>
                    ) : null}
                  </div>
                }
              />

              <div className={playlistStyles.playlistMain}>
                {trackCount > 0 ? (
                  <>
                    <h2 className={playlistStyles.trackListHeading}>Tracks</h2>
                    <ul
                      className={classNames(
                        tracklistStyles.tracklist,
                        playlistStyles.tracklistPanel,
                      )}
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
                        />
                      ))}
                    </ul>
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
