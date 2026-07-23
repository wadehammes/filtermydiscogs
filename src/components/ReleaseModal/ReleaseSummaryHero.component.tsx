"use client";

import classNames from "classnames";
import Image from "next/image";
import { useCallback } from "react";
import { trackEvent } from "src/analytics/analytics";
import { HorizontalScrollRow } from "src/components/shared/HorizontalScrollRow/HorizontalScrollRow.component";
import { useCrate } from "src/context/crate.context";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import ExternalLinkIcon from "src/styles/icons/external-link-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import StarIcon from "src/styles/icons/star-thin.svg";
import XIcon from "src/styles/icons/x-thin.svg";
import typographyStyles from "src/styles/typography.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
} from "src/utils/releaseDisplay";
import styles from "./ReleaseSummaryHero.module.css";

interface ReleaseSummaryHeroProps {
  release: DiscogsRelease;
  titleId?: string;
  onClose?: () => void;
}

export const ReleaseSummaryHero = ({
  release,
  titleId,
  onClose,
}: ReleaseSummaryHeroProps) => {
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const inCrate = isInCrate(release.instance_id);
  const selectedStyles = useSelectedStyles();
  const selectedFormats = useSelectedFormats();
  const handlePillClick = usePillClickHandler({ category: "releaseModal" });

  const { basic_information: basicInfo } = release;
  const { formats: releaseFormats, styles: releaseStyles } = basicInfo;
  const formatTags =
    releaseFormats && releaseFormats.length > 0
      ? getReleaseFormatTags(releaseFormats)
      : [];
  const artistNames = formatArtistNames(release);
  const metaLine = formatReleaseMetaLine({ release });
  const releaseUrl = getResourceUrl({
    resourceUrl: basicInfo.resource_url,
    type: "release",
  });
  const thumbUrl = getReleaseImageUrl({
    thumb: basicInfo.thumb,
    cover_image: basicInfo.cover_image,
    width: 200,
    height: 200,
    preferCoverImage: true,
  });

  const handleCrateToggle = useCallback(() => {
    if (inCrate) {
      removeFromCrate(release.instance_id);
      return;
    }

    addToCrate(release);
    if (!isMobile) {
      openDrawer();
    }
  }, [addToCrate, inCrate, isMobile, openDrawer, release, removeFromCrate]);

  return (
    <div className={styles.hero} data-testid="fmdReleaseSummaryHero">
      <div className={styles.heroToolbar}>
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={classNames(styles.actionButton, styles.crateButton, {
              [styles.crateButtonActive]: inCrate,
            })}
            onClick={handleCrateToggle}
            aria-label={inCrate ? "Remove from crate" : "Add to crate"}
            title={inCrate ? "Remove from Crate" : "Add to Crate"}
          >
            {inCrate ? (
              <MinusIcon className={styles.actionIcon} />
            ) : (
              <PlusIcon className={styles.actionIcon} />
            )}
          </button>
          {releaseUrl ? (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={classNames(styles.actionButton, styles.discogsButton)}
              aria-label="View on Discogs"
              title="View on Discogs"
              onClick={() => {
                trackEvent("releaseClicked", {
                  action: "releaseClicked",
                  category: "releaseModal",
                  label: "View on Discogs",
                  value: releaseUrl,
                });
              }}
            >
              <ExternalLinkIcon className={styles.actionIcon} />
            </a>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            className={classNames(styles.actionButton, styles.closeButton)}
            onClick={onClose}
            aria-label="Close modal"
          >
            <XIcon className={styles.actionIcon} />
          </button>
        ) : null}
      </div>
      <div className={styles.heroMain}>
        <div className={styles.coverWrapper}>
          {thumbUrl ? (
            <Image
              src={thumbUrl}
              alt={basicInfo.title}
              width={96}
              height={96}
              className={styles.cover}
              sizes="96px"
            />
          ) : null}
        </div>
        <div className={styles.details}>
          <div className={styles.detailsText}>
            <p
              className={classNames(
                typographyStyles.metaCaption,
                styles.artist,
              )}
            >
              {artistNames}
            </p>
            <h2 className={styles.title} {...definedProps({ id: titleId })}>
              {basicInfo.title}
            </h2>
            {metaLine ? (
              <p
                className={classNames(
                  typographyStyles.metaCaption,
                  styles.metaLine,
                )}
              >
                {metaLine}
              </p>
            ) : null}
            {formatTags.length > 0 || (releaseStyles?.length ?? 0) > 0 ? (
              <HorizontalScrollRow className={styles.tagsRow}>
                {formatTags.map((formatName) => (
                  <button
                    key={formatName}
                    type="button"
                    className={classNames("pill", "pillFormat", {
                      pillSelected: selectedFormats.includes(formatName),
                    })}
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
                {releaseStyles?.map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={classNames("pill", "pillStyle", {
                      pillSelected: selectedStyles.includes(style),
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
              </HorizontalScrollRow>
            ) : null}
          </div>
          {release.rating > 0 ? (
            <div
              className={styles.ratingBadge}
              title={`Rating: ${release.rating}/5`}
            >
              <StarIcon className={styles.starIcon} />
              {release.rating}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
