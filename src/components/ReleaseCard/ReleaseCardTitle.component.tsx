import classNames from "classnames";
import { trackEvent } from "src/analytics/analytics";
import type { DiscogsArtist } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getResourceUrl } from "src/utils/helpers";
import { normalizeDiscogsJoin } from "src/utils/releaseDisplay";
import styles from "./ReleaseCardTitle.module.css";

interface ReleaseCardTitleProps {
  artists: DiscogsArtist[];
  title: string;
  releaseUrl: string | null;
  resourceUrl: string | null;
  analyticsCategory?: "releaseCard" | "publicCrate" | "home";
  className?: string | undefined;
  onReleaseOpen?: () => void;
}

const renderReleaseTitle = ({
  title,
  onReleaseOpen,
  releaseUrl,
  resourceUrl,
  analyticsCategory,
}: {
  title: string;
  onReleaseOpen?: () => void;
  releaseUrl: string | null;
  resourceUrl: string | null;
  analyticsCategory: "releaseCard" | "publicCrate" | "home";
}) => {
  if (onReleaseOpen) {
    return (
      <button
        type="button"
        onClick={onReleaseOpen}
        className={styles.titleLink}
        title="Open release details"
      >
        {title}
      </button>
    );
  }

  if (releaseUrl) {
    return (
      <a
        href={releaseUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackEvent("releaseClicked", {
            action: "releaseClicked",
            category: analyticsCategory,
            label: "Release Clicked",
            value: resourceUrl ?? releaseUrl ?? "",
          });
        }}
        className={styles.titleLink}
        title="View release on Discogs"
      >
        {title}
      </a>
    );
  }

  return <span>{title}</span>;
};

export const ReleaseCardTitle = ({
  artists,
  title,
  releaseUrl,
  resourceUrl,
  analyticsCategory = "releaseCard",
  className,
  onReleaseOpen,
}: ReleaseCardTitleProps) => {
  return (
    <div className={classNames(styles.titleGroup, className)}>
      <p className={styles.artistLine}>
        {artists.map((artist, index) => {
          const artistUrl = getResourceUrl({
            resourceUrl: artist.resource_url,
            type: "artist",
          });

          return (
            <span key={artist.id ?? `${artist.name}-${index}`}>
              {artistUrl ? (
                <a
                  href={artistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`View ${artist.name} on Discogs`}
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent("artistClicked", {
                      action: "artistClicked",
                      category: analyticsCategory,
                      label: "Artist Clicked",
                      value: artistUrl,
                    });
                  }}
                  className={styles.artistLink}
                >
                  {artist.name}
                </a>
              ) : (
                artist.name
              )}
              {index < artists.length - 1
                ? normalizeDiscogsJoin(artist.join)
                : null}
            </span>
          );
        })}
      </p>
      <h3 className={styles.releaseTitle}>
        {renderReleaseTitle({
          title,
          releaseUrl,
          resourceUrl,
          analyticsCategory,
          ...definedProps({ onReleaseOpen }),
        })}
      </h3>
    </div>
  );
};
