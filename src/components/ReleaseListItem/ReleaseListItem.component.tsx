import classNames from "classnames";
import Image from "next/image";
import type React from "react";
import { memo, useCallback } from "react";
import { trackEvent } from "src/analytics/analytics";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { useCrate } from "src/context/crate.context";
import { useSelectedStyles } from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { DiscogsArtist, ReleaseListItemProps } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import styles from "./ReleaseListItem.module.css";

const ReleaseListItemComponent = ({
  release,
  isHighlighted = false,
  onExitRandomMode,
  onReleaseClick,
}: ReleaseListItemProps) => {
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const selectedStyles = useSelectedStyles();
  const {
    labels,
    year,
    artists,
    title,
    thumb,
    styles: releaseStyles,
    resource_url,
    cover_image,
  } = release.basic_information;
  const thumbUrl = getReleaseImageUrl({
    thumb,
    cover_image,
    width: 60,
    height: 60,
    preferCoverImage: false,
  });

  const releaseUrl = getResourceUrl({
    resourceUrl: resource_url,
    type: "release",
  });

  const labelUrl = getResourceUrl({
    resourceUrl: labels[0]?.resource_url,
    type: "label",
  });

  const getArtistUrl = useCallback((artist: DiscogsArtist) => {
    return getResourceUrl({
      resourceUrl: artist?.resource_url,
      type: "artist",
    });
  }, []);

  const handlePillClick = usePillClickHandler({
    category: "releaseListItem",
    onExitRandomMode,
  });

  const handleStylePillClick = useCallback(
    (e: React.MouseEvent, style: string) => {
      handlePillClick({
        event: e,
        value: style,
        type: "style",
        eventLabel: "Style Pill Clicked",
      });
    },
    [handlePillClick],
  );

  const handleCrateToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isInCrate(release.instance_id)) {
        removeFromCrate(release.instance_id);
      } else {
        addToCrate(release);
        openDrawer();
      }
    },
    [isInCrate, addToCrate, removeFromCrate, openDrawer, release],
  );

  const { openRelease, canOpen } = useReleaseOpenHandler({
    release,
    onReleaseClick,
  });

  const imageActivateProps = canOpen
    ? getReleaseActivateProps({
        onActivate: openRelease,
        ariaLabel: `Open ${title} details`,
      })
    : undefined;

  return (
    <div
      className={classNames(styles.releaseItem, {
        [styles.highlighted]: isHighlighted,
        [styles.inCrate]: isInCrate(release.instance_id),
      })}
    >
      <div
        className={styles.imageContainer}
        {...definedProps(imageActivateProps ?? {})}
      >
        <Image
          src={thumbUrl}
          height={60}
          width={60}
          quality={85}
          alt={title}
          loading="lazy"
          sizes="60px"
        />
      </div>

      <div className={styles.content}>
        <div className={styles.contentLeft}>
          <div className={styles.mainInfo}>
            <h3 className={styles.title}>
              {artists.map((artist, index) => {
                const artistUrl = getArtistUrl(artist);
                return (
                  <span key={artist.id ?? `${artist.name}-${index}`}>
                    {artistUrl ? (
                      <a
                        href={artistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          trackEvent("artistClicked", {
                            action: "artistClicked",
                            category: "releaseListItem",
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
              })}{" "}
              -{" "}
              {canOpen ? (
                <button
                  type="button"
                  onClick={openRelease}
                  className={styles.titleLink}
                  title="Open release details"
                >
                  {title}
                </button>
              ) : releaseUrl ? (
                <a
                  href={releaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    trackEvent("releaseClicked", {
                      action: "releaseClicked",
                      category: "home",
                      label: "Release Clicked (List View)",
                      value: resource_url,
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
            <p className={styles.details}>
              {labelUrl ? (
                <a
                  href={labelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent("labelClicked", {
                      action: "labelClicked",
                      category: "releaseListItem",
                      label: "Label Clicked",
                      value: labelUrl,
                    });
                  }}
                  className={styles.labelLink}
                >
                  {labels[0]?.name}
                </a>
              ) : (
                labels[0]?.name
              )}{" "}
              {year !== 0 ? `— ${year}` : ""}
            </p>
            <ReleaseNotes release={release} />
          </div>

          <div className={styles.styles}>
            {releaseStyles && releaseStyles.length > 0 && (
              <div className={styles.stylesContainer}>
                {releaseStyles.map((style: string) => (
                  <button
                    key={style}
                    type="button"
                    className={classNames(styles.stylePill, {
                      [styles.stylePillSelected]:
                        selectedStyles.includes(style),
                    })}
                    onClick={(e) => handleStylePillClick(e, style)}
                    aria-label={`Filter by ${style} style`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.crateButton}
            onClick={handleCrateToggle}
            aria-label={
              isInCrate(release.instance_id)
                ? "Remove from crate"
                : "Add to crate"
            }
          >
            {isInCrate(release.instance_id)
              ? "− Remove from Crate"
              : "+ Add to Crate"}
          </button>
          {releaseUrl && (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.discogsButton}
              onClick={(e) => {
                e.stopPropagation();
                trackEvent("releaseClicked", {
                  action: "releaseClicked",
                  category: "home",
                  label: "Release Clicked (List View)",
                  value: resource_url,
                });
              }}
            >
              View on Discogs
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const ReleaseListItem = memo(ReleaseListItemComponent);
