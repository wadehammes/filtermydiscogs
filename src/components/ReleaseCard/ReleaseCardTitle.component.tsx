import { trackEvent } from "src/analytics/analytics";
import type { DiscogsArtist } from "src/types";
import { getResourceUrl } from "src/utils/helpers";
import styles from "./ReleaseCardTitle.module.css";

interface ReleaseCardTitleProps {
  artists: DiscogsArtist[];
  title: string;
  releaseUrl: string | null;
  resourceUrl: string | null;
  analyticsCategory?: "releaseCard" | "publicCrate" | "home";
}

export function ReleaseCardTitle({
  artists,
  title,
  releaseUrl,
  resourceUrl,
  analyticsCategory = "releaseCard",
}: ReleaseCardTitleProps) {
  return (
    <div className={styles.titleGroup}>
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
              {index < artists.length - 1 && ", "}
            </span>
          );
        })}
      </p>
      <h3 className={styles.releaseTitle}>
        {releaseUrl ? (
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
        ) : (
          <span>{title}</span>
        )}
      </h3>
    </div>
  );
}
