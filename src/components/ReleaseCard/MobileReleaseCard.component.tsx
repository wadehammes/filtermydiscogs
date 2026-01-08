import classNames from "classnames";
import Image from "next/image";
import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { LoadingOverlay } from "src/components/LoadingOverlay/LoadingOverlay.component";
import { useCrate } from "src/context/crate.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import ExternalLinkIcon from "src/styles/icons/external-link-solid.svg";
import MinusIcon from "src/styles/icons/minus-solid.svg";
import PlusIcon from "src/styles/icons/plus-solid.svg";
import type { ReleaseCardProps } from "src/types";
import styles from "./MobileReleaseCard.module.css";

const MobileReleaseCardComponent = ({
  release,
  isHighlighted = false,
  isRandomMode = false,
  onExitRandomMode,
}: ReleaseCardProps) => {
  const [isClicked, setIsClicked] = useState(false);
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const {
    labels,
    year,
    artists,
    title,
    thumb,
    cover_image,
    styles: releaseStyles,
    formats: releaseFormats,
    resource_url,
  } = release.basic_information;

  const formatDateAdded = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const dateAdded = release.date_added
    ? formatDateAdded(release.date_added)
    : null;
  const thumbUrl =
    (cover_image || thumb) ??
    "https://placehold.jp/effbf2/000/150x150.png?text=%F0%9F%98%B5";

  const releaseId = resource_url.split("/").pop() || "";
  const fallbackUri = `https://www.discogs.com/release/${releaseId}`;

  const getResourceUrl = useCallback(
    ({
      resourceUrl,
      type,
    }: {
      resourceUrl: string | undefined;
      type: "artist" | "label";
    }) => {
      if (!resourceUrl) return null;
      const id = resourceUrl.split("/").pop();
      return id ? `https://www.discogs.com/${type}/${id}` : null;
    },
    [],
  );

  const labelUrl = getResourceUrl({
    resourceUrl: labels[0]?.resource_url,
    type: "label",
  });

  const { data: releaseData, isLoading } = useDiscogsReleaseQuery(
    releaseId,
    isClicked,
  );

  const handleReleaseClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();

      setIsClicked(true);

      trackEvent("releaseClicked", {
        action: "releaseClicked",
        category: "home",
        label: "Release Clicked",
        value: resource_url,
      });

      if (releaseData?.uri) {
        window.open(releaseData.uri, "_blank", "noopener,noreferrer");
        return;
      }
    },
    [releaseData?.uri, resource_url],
  );

  const handleUrlOpen = useCallback(() => {
    if (releaseData?.uri) {
      window.open(releaseData.uri, "_blank", "noopener,noreferrer");
    } else if (!isLoading) {
      window.open(fallbackUri, "_blank", "noopener,noreferrer");
    }
  }, [releaseData?.uri, isLoading, fallbackUri]);

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

  const handlePillClick = useCallback(
    ({
      event,
      value,
      type,
      eventLabel,
    }: {
      event: React.MouseEvent;
      value: string;
      type: "style" | "format";
      eventLabel: string;
    }) => {
      event.preventDefault();
      event.stopPropagation();

      trackEvent(`${type}PillClicked`, {
        action: `${type}PillClicked`,
        category: "releaseCard",
        label: eventLabel,
        value,
      });

      if (filtersState.isRandomMode) {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
        onExitRandomMode?.();
      }

      filtersDispatch({
        type:
          type === "style"
            ? FiltersActionTypes.ToggleStyle
            : FiltersActionTypes.ToggleFormat,
        payload: value,
      });
    },
    [filtersDispatch, filtersState.isRandomMode, onExitRandomMode],
  );

  useEffect(() => {
    if (isClicked && releaseData?.uri) {
      handleUrlOpen();
      setIsClicked(false);
    }
  }, [isClicked, releaseData?.uri, handleUrlOpen]);

  return release ? (
    <>
      <div
        className={classNames(styles.releaseCard, {
          [styles.highlighted as string]: isHighlighted,
          [styles.inCrate as string]: isInCrate(release.instance_id),
          [styles.randomMode as string]: isRandomMode,
        })}
      >
        <div
          className={styles.imageContainer}
          data-bg-image={thumbUrl || undefined}
          style={
            thumbUrl
              ? {
                  backgroundImage: `url(${thumbUrl})`,
                }
              : undefined
          }
        >
          {thumbUrl && (
            <Image
              src={thumbUrl}
              height={200}
              width={200}
              quality={85}
              alt={release.basic_information.title}
              loading="lazy"
              className={styles.releaseImage}
              style={{
                position: "relative",
                zIndex: 2,
                filter: "none",
              }}
              sizes="100px"
            />
          )}
        </div>
        <div className={styles.contentContainer}>
          <div className={styles.mainContent}>
            <h3 className={styles.title}>
              {artists.map((artist, index) => {
                const artistUrl = getResourceUrl({
                  resourceUrl: artist.resource_url,
                  type: "artist",
                });
                return (
                  <span key={artist.id || index}>
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
                            category: "releaseCard",
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
              <button
                type="button"
                onClick={handleReleaseClick}
                disabled={isLoading}
                className={styles.titleLink}
                title="View release on Discogs"
              >
                {title}
              </button>
            </h3>
            <div className={styles.metaContainer}>
              {(labels[0]?.name || year !== 0) && (
                <p className={styles.meta}>
                  {labelUrl ? (
                    <a
                      href={labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`View ${labels[0]?.name} on Discogs`}
                      onClick={(e) => {
                        e.stopPropagation();
                        trackEvent("labelClicked", {
                          action: "labelClicked",
                          category: "releaseCard",
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
                  )}
                  {labels[0]?.name && year !== 0 ? " • " : ""}
                  {year !== 0 ? year : ""}
                </p>
              )}
              {dateAdded && (
                <p className={styles.meta}>Date Added: {dateAdded}</p>
              )}
            </div>
          </div>
          <div className={styles.genresContainer}>
            {releaseFormats &&
              releaseFormats.length > 0 &&
              Array.from(
                new Set(releaseFormats.map((format) => format.name)),
              ).map((formatName) => (
                <button
                  key={formatName}
                  type="button"
                  className={classNames(
                    "pill",
                    "pillFormat",
                    styles.formatPill,
                    {
                      pillSelected:
                        filtersState.selectedFormats.includes(formatName),
                    },
                  )}
                  onClick={(e) =>
                    handlePillClick({
                      event: e,
                      value: formatName,
                      type: "format",
                      eventLabel: "Format Pill Clicked",
                    })
                  }
                  aria-label={`Filter by ${formatName} format`}
                >
                  {formatName}
                </button>
              ))}

            {releaseStyles &&
              releaseStyles.length > 0 &&
              releaseStyles.map((style: string) => (
                <button
                  key={style}
                  type="button"
                  className={classNames("pill", "pillStyle", styles.stylePill, {
                    pillSelected: filtersState.selectedStyles.includes(style),
                  })}
                  onClick={(e) =>
                    handlePillClick({
                      event: e,
                      value: style,
                      type: "style",
                      eventLabel: "Style Pill Clicked",
                    })
                  }
                  aria-label={`Filter by ${style} style`}
                >
                  {style}
                </button>
              ))}
          </div>
        </div>
        <div className={styles.actionButtonsContainer}>
          <button
            type="button"
            className={styles.discogsButton}
            onClick={handleReleaseClick}
            disabled={isLoading}
            aria-label="View on Discogs"
            title="View on Discogs"
          >
            <ExternalLinkIcon className={styles.externalLinkIcon} />
          </button>
          <button
            type="button"
            className={classNames(
              styles.listButton,
              isInCrate(release.instance_id) && styles.removeButton,
            )}
            onClick={handleCrateToggle}
            aria-label={
              isInCrate(release.instance_id)
                ? "Remove from crate"
                : "Add to crate"
            }
          >
            {isInCrate(release.instance_id) ? (
              <MinusIcon className={styles.listButtonIcon} />
            ) : (
              <PlusIcon className={styles.listButtonIcon} />
            )}
          </button>
        </div>
      </div>
      <LoadingOverlay
        message="Fetching Discogs Release URL"
        isVisible={isLoading}
      />
    </>
  ) : null;
};

export const MobileReleaseCard = memo(MobileReleaseCardComponent);
export default MobileReleaseCard;
