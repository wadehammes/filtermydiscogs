import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import type { DiscogsVideo } from "src/types";

interface ReleasePlaybackFallbackProps {
  fallbackSearchUrl: string;
  videos: DiscogsVideo[];
}

export const ReleasePlaybackFallback = ({
  fallbackSearchUrl,
  videos,
}: ReleasePlaybackFallbackProps) => {
  return (
    <div className={styles.playbackNoPreview}>
      <p className={styles.noPreviewMessage}>
        No playable videos for this release. Try YouTube or an external link
        below.
      </p>
      <a
        href={fallbackSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.searchLink}
      >
        Search YouTube
      </a>
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
