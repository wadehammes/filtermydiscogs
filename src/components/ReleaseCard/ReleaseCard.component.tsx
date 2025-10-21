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
    styles: releaseStyles,
    resource_url,
  } = release.basic_information;
  const thumbUrl = thumb
    ? thumb
    : "https://placehold.jp/effbf2/000/150x150.png?text=%F0%9F%98%B5";

  // Extract release ID from resource_url
  const releaseId = resource_url.split("/").pop() || "";
  const fallbackUri = `https://www.discogs.com/release/${releaseId}`;

  // Only fetch release data when clicked
  const { data: releaseData, isLoading } = useDiscogsReleaseQuery(
    releaseId,
    isClicked, // Only enable query when clicked
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

      // If we already have the data, open immediately
      if (releaseData?.uri) {
        window.open(releaseData.uri, "_blank", "noopener,noreferrer");
        return;
      }

      // Otherwise, wait for the query to complete
      // The useEffect below will handle opening the URL once data is loaded
    },
    [releaseData?.uri, resource_url],
  );

  // Open URL once we have the release data
  const handleUrlOpen = useCallback(() => {
    if (releaseData?.uri) {
      window.open(releaseData.uri, "_blank", "noopener,noreferrer");
    } else if (!isLoading) {
      // If query failed, use fallback
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

      // Exit random mode when clicking a style pill
      if (filtersState.isRandomMode) {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
        // Call the callback to change view back to card
        onExitRandomMode?.();
      }

      filtersDispatch({
        type: FiltersActionTypes.ToggleStyle,
        payload: style,
      });
    },
    [
      filtersDispatch,
      filtersState.isRandomMode, // Call the callback to change view back to card
      onExitRandomMode,
    ],
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
          style={{
            backgroundImage: thumbUrl ? `url(${thumbUrl})` : "none",
          }}
        >
          {thumbUrl && (
            <Image
              src={thumbUrl}
              height={200}
              width={200}
              quality={85}
              alt={release.basic_information.title}
              loading="lazy"
              style={{ position: "relative", zIndex: 2 }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
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
            <span className={styles.listButtonIcon}>
              {isInCrate(release.instance_id) ? "−" : "+"}
            </span>
            <span className={styles.listButtonText}>
              {isInCrate(release.instance_id)
                ? "Remove from Crate"
                : "Add to Crate"}
            </span>
          </button>
        </div>
        <div className={styles.contentContainer}>
          <div className={styles.mainContent}>
            <span className="typography-span">
              <b>
                {artists.map((artist) => artist.name).join(", ")} - {title}
              </b>
            </span>
            <span className="typography-span typography-span-small">
              {labels[0]?.name} {year !== 0 ? `— ${year}` : ""}
            </span>
            <span className="typography-span typography-span-small">
              {release?.notes?.map((note) => note.value).join(", ")}
            </span>
          </div>
          <div className={styles.genresContainer}>
            {releaseStyles && releaseStyles.length > 0 && (
              <div className={styles.stylesContainer}>
                {releaseStyles.map((style: string) => (
                  <button
                    key={style}
                    type="button"
                    className={classNames(styles.stylePill, {
                      [styles.stylePillSelected as string]:
                        filtersState.selectedStyles.includes(style),
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
          <div className={styles.quickLinks}>
            <button
              type="button"
              className={styles.discogsButton}
              onClick={handleReleaseClick}
              disabled={isLoading}
            >
              View on Discogs &rarr;
            </button>
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
