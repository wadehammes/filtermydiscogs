import classNames from "classnames";
import type { MouseEvent } from "react";
import type { DiscogsArtist } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getResourceUrl } from "src/utils/helpers";
import { normalizeDiscogsJoin } from "src/utils/releaseDisplay";
import styles from "./ReleaseHeaderLinks.module.css";

const stopLinkPropagation = (event: MouseEvent<HTMLAnchorElement>) => {
  event.stopPropagation();
};

interface ReleaseHeaderArtistLineProps {
  artists: DiscogsArtist[];
  className?: string;
  linkClassName?: string;
}

export const ReleaseHeaderArtistLine = ({
  artists,
  className,
  linkClassName,
}: ReleaseHeaderArtistLineProps) => {
  return (
    <div className={className}>
      {artists.map((artist, index) => {
        const artistUrl = getResourceUrl({
          resourceUrl: artist.resource_url,
          type: "artist",
          id: artist.id,
        });

        return (
          <span key={`${artist.id ?? artist.name}-${index}`}>
            {artistUrl ? (
              <a
                href={artistUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`View ${artist.name} on Discogs`}
                className={classNames(styles.discogsLink, linkClassName)}
                onClick={stopLinkPropagation}
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
    </div>
  );
};

interface ReleaseHeaderTitleProps {
  title: string;
  releaseUrl: string | null;
  titleId?: string | undefined;
  className?: string | undefined;
  linkClassName?: string | undefined;
  titleTag?: "h2" | "h3";
}

export const ReleaseHeaderTitle = ({
  title,
  releaseUrl,
  titleId,
  className,
  linkClassName,
  titleTag: TitleTag = "h3",
}: ReleaseHeaderTitleProps) => {
  return (
    <TitleTag className={className} {...definedProps({ id: titleId })}>
      {releaseUrl ? (
        <a
          href={releaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View release on Discogs"
          className={classNames(styles.titleLink, linkClassName)}
          onClick={stopLinkPropagation}
        >
          {title}
        </a>
      ) : (
        <span>{title}</span>
      )}
    </TitleTag>
  );
};
