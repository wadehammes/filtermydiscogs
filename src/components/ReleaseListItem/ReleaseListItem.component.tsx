import classNames from "classnames";
import Image from "next/image";
import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import LoadingOverlay from "src/components/LoadingOverlay/LoadingOverlay.component";
import { useCrate } from "src/context/crate.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { ReleaseListItemProps } from "src/types";
import styles from "./ReleaseListItem.module.css";

const ReleaseListItemComponent = ({
  release,
  isHighlighted = false,
  onExitRandomMode,
}: ReleaseListItemProps) => {
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
    : "https://placehold.jp/effbf2/000/60x60.png?text=%F0%9F%98%B5";

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
        label: "Release Clicked (List View)",
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

  const handleStylePillClick = useCallback(
    (e: React.MouseEvent, style: string) => {
      e.preventDefault();
      e.stopPropagation();

      trackEvent("stylePillClicked", {
        action: "stylePillClicked",
        category: "releaseListItem",
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
    [filtersDispatch, filtersState.isRandomMode, onExitRandomMode],
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

  useEffect(() => {
    if (isClicked && releaseData?.uri) {
      handleUrlOpen();
      setIsClicked(false);
    }
  }, [isClicked, releaseData?.uri, handleUrlOpen]);

  return (
    <>
      <div
        className={classNames(styles.releaseItem, {
          [styles.highlighted as string]: isHighlighted,
          [styles.inCrate as string]: isInCrate(release.instance_id),
        })}
      >
        <div className={styles.imageContainer}>
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
                {artists.map((artist) => artist.name).join(", ")} - {title}
              </h3>
              <p className={styles.details}>
                {labels[0]?.name} {year !== 0 ? `— ${year}` : ""}
              </p>
              {release?.notes?.length > 0 && (
                <p className={styles.notes}>
                  {release.notes.map((note) => note.value).join(", ")}
                </p>
              )}
            </div>

            <div className={styles.styles}>
              {releaseStyles && releaseStyles.length > 0 && (
                <div className={styles.stylesContainer}>
                  {releaseStyles.slice(0, 3).map((style: string) => (
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
                  {releaseStyles.length > 3 && (
                    <span className={styles.moreStyles}>
                      +{releaseStyles.length - 3} more
                    </span>
                  )}
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
            <button
              type="button"
              className={styles.discogsButton}
              onClick={handleReleaseClick}
              disabled={isLoading}
            >
              View on Discogs
            </button>
          </div>
        </div>
      </div>
      <LoadingOverlay
        message="Fetching Discogs Release URL"
        isVisible={isLoading}
      />
    </>
  );
};

export const ReleaseListItem = memo(ReleaseListItemComponent);
export default ReleaseListItem;
