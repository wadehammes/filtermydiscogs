"use client";

import Image from "next/image";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import textActionStyles from "src/styles/modules/text-action.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./ReleasesTable.module.css";

interface ReleasesTableArtistTitleCellProps {
  release: DiscogsRelease;
  imagePriority: boolean;
  onReleaseClick: (instanceId: string) => void;
}

export const ReleasesTableArtistTitleCell = ({
  release,
  imagePriority,
  onReleaseClick,
}: ReleasesTableArtistTitleCellProps) => {
  const { openRelease, prefetchPointerProps } = useReleaseOpenHandler({
    release,
    onReleaseClick,
  });
  const { artists, title, thumb, cover_image, resource_url } =
    release.basic_information;
  const releaseUrl = getResourceUrl({
    resourceUrl: resource_url,
    type: "release",
  });
  const thumbUrl = getReleaseImageUrl({
    thumb,
    cover_image,
    width: 40,
    height: 40,
    preferCoverImage: false,
  });

  return (
    <div
      className={styles.artistTitleCell}
      {...definedProps(prefetchPointerProps ?? {})}
    >
      <button
        type="button"
        className={styles.artistTitleThumb}
        title={`View ${title}`}
        onClick={(event) => {
          event.stopPropagation();
          openRelease();
        }}
        aria-label={`View ${title}`}
      >
        <Image
          src={thumbUrl}
          height={40}
          width={40}
          quality={85}
          alt=""
          {...(imagePriority
            ? { priority: true }
            : { loading: "lazy" as const })}
          sizes="40px"
        />
      </button>
      <div className={styles.artistTitleText}>
        <span className={styles.artistName}>
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
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    className={textActionStyles.entitylinkprimary}
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
        </span>
        {releaseUrl ? (
          <a
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={textActionStyles.entitylinktitletruncated}
            title={title}
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            {title}
          </a>
        ) : (
          <span
            className={textActionStyles.entitylinktitletruncated}
            title={title}
          >
            {title}
          </span>
        )}
      </div>
    </div>
  );
};
