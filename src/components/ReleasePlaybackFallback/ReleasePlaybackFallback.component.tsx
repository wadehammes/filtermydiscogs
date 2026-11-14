import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import type { DiscogsVideo } from "src/types";
import { getDiscogsReleaseVideosUpdateUrl } from "src/utils/discogsReleaseUrls";

interface ReleasePlaybackFallbackProps {
  discogsReleaseId: number | null | undefined;
  fallbackSearchUrl: string;
  tracksLackMatchedVideos?: boolean;
  videos: DiscogsVideo[];
}

export const ReleasePlaybackFallback = ({
  discogsReleaseId,
  fallbackSearchUrl,
  tracksLackMatchedVideos = false,
  videos,
}: ReleasePlaybackFallbackProps) => {
  const discogsVideosUpdateUrl =
    getDiscogsReleaseVideosUpdateUrl(discogsReleaseId);
  const primaryHref = discogsVideosUpdateUrl ?? fallbackSearchUrl;
  const primaryLabel = discogsVideosUpdateUrl
    ? "Add videos on Discogs"
    : "Search YouTube";
  const message = discogsVideosUpdateUrl
    ? tracksLackMatchedVideos
      ? "Tracks aren't linked to videos yet."
      : "No videos on this release yet."
    : "Nothing to play in-app.";

  return (
    <div className={styles.playbackNoPreview}>
      <p className={styles.noPreviewMessage}>
        {message}{" "}
        <a
          href={primaryHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.inlineCtaLink}
        >
          {primaryLabel}
        </a>
      </p>
      {videos.length > 0 ? (
        <ul className={styles.externalVideos}>
          {videos.map((video) => (
            <li key={video.uri}>
              <a href={video.uri} target="_blank" rel="noopener noreferrer">
                {video.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
