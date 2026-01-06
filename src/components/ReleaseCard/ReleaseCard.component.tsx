import classNames from "classnames";
import Image from "next/image";
import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { LoadingOverlay } from "src/components/LoadingOverlay/LoadingOverlay.component";
import { useCrate } from "src/context/crate.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { ReleaseCardProps } from "src/types";
import styles from "./ReleaseCard.module.css";

const ReleaseCardComponent = ({
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

  const handleStylePillClick = useCallback(
    (e: React.MouseEvent, style: string) => {
      e.preventDefault();
      e.stopPropagation();

      trackEvent("stylePillClicked", {
        action: "stylePillClicked",
        category: "releaseCard",
        label: "Style Pill Clicked",
        value: style,
      });

      if (filtersState.isRandomMode) {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
        onExitRandomMode?.();
      }

      filtersDispatch({
        type: FiltersActionTypes.ToggleStyle,
        payload: style,
      });
    },
    [filtersDispatch, filtersState.isRandomMode, onExitRandomMode],
  );

  const handleFormatPillClick = useCallback(
    (e: React.MouseEvent, format: string) => {
      e.preventDefault();
      e.stopPropagation();

      trackEvent("formatPillClicked", {
        action: "formatPillClicked",
        category: "releaseCard",
        label: "Format Pill Clicked",
        value: format,
      });

      if (filtersState.isRandomMode) {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
        onExitRandomMode?.();
      }

      filtersDispatch({
        type: FiltersActionTypes.ToggleFormat,
        payload: format,
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
              style={{
                position: "relative",
                zIndex: 2,
                filter: "none",
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.discogsIconButton}
              onClick={handleReleaseClick}
              disabled={isLoading}
              aria-label="View on Discogs"
              title="View on Discogs"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={styles.externalLinkIcon}
              >
                <path d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6zm11-3v8h-2V6.413l-7.793 7.794-1.414-1.414L17.586 5H13V3h8z" />
              </svg>
              <span className={styles.tooltip}>View on Discogs</span>
            </button>
            <button
              type="button"
              className={styles.listButton}
              onClick={handleCrateToggle}
              aria-label={
                isInCrate(release.instance_id)
                  ? "Remove from crate"
                  : "Add to crate"
              }
            >
              {isInCrate(release.instance_id) ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.listButtonIcon}
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.listButtonIcon}
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
              <span className={styles.listButtonText}>
                {isInCrate(release.instance_id)
                  ? "Remove from Crate"
                  : "Add to Crate"}
              </span>
            </button>
          </div>
        </div>
        <div className={styles.contentContainer}>
          <div className={styles.mainContent}>
            <h3 className={styles.title}>
              {artists.map((artist) => artist.name).join(", ")} - {title}
            </h3>
            <div className={styles.metaContainer}>
              {(labels[0]?.name || year !== 0) && (
                <p className={styles.meta}>
                  {labels[0]?.name}
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
                  onClick={(e) => handleFormatPillClick(e, formatName)}
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
                  onClick={(e) => handleStylePillClick(e, style)}
                  aria-label={`Filter by ${style} style`}
                >
                  {style}
                </button>
              ))}
          </div>
        </div>
      </div>
      <LoadingOverlay
        message="Fetching Discogs Release URL"
        isVisible={isLoading}
      />
    </>
  ) : null;
};

export const ReleaseCard = memo(ReleaseCardComponent);

export default ReleaseCard;
