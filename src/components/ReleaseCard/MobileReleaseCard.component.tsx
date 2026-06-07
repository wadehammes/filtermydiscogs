import classNames from "classnames";
import Image from "next/image";
import type React from "react";
import { memo, useCallback } from "react";
import { trackEvent } from "src/analytics/analytics";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import notesStyles from "src/components/ReleaseNotes/ReleaseNotes.module.css";
import { ReleaseNotesCardAction } from "src/components/ReleaseNotes/ReleaseNotesCardAction.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import { HorizontalScrollRow } from "src/components/shared/HorizontalScrollRow/HorizontalScrollRow.component";
import { useCrate } from "src/context/crate.context";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import ExternalLinkIcon from "src/styles/icons/external-link-solid.svg";
import MinusIcon from "src/styles/icons/minus-solid.svg";
import PlusIcon from "src/styles/icons/plus-solid.svg";
import StarIcon from "src/styles/icons/star-solid.svg";
import type { ReleaseCardProps } from "src/types";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./MobileReleaseCard.module.css";
import {
  ReleaseCardCatalog,
  ReleaseCardMeta,
} from "./ReleaseCardMeta.component";
import metaStyles from "./ReleaseCardMeta.module.css";
import { ReleaseCardTitle } from "./ReleaseCardTitle.component";
import titleStyles from "./ReleaseCardTitle.module.css";

const MobileReleaseCardComponent = ({
  release,
  isHighlighted = false,
  isRandomMode = false,
  onExitRandomMode,
}: ReleaseCardProps) => {
  const { addToCrate, removeFromCrate, isInCrate } = useCrate();
  const selectedStyles = useSelectedStyles();
  const selectedFormats = useSelectedFormats();
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

  const thumbUrl = getReleaseImageUrl({
    thumb,
    cover_image,
    width: 200,
    height: 200,
    preferCoverImage: true,
  });

  const releaseUrl = getResourceUrl({
    resourceUrl: resource_url,
    type: "release",
  });

  const labelUrl = getResourceUrl({
    resourceUrl: labels[0]?.resource_url,
    type: "label",
  });

  const catno = labels[0]?.catno ? String(labels[0].catno) : null;

  const handleCrateToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isInCrate(release.instance_id)) {
        removeFromCrate(release.instance_id);
      } else {
        addToCrate(release);
        // Don't open drawer on mobile
      }
    },
    [isInCrate, addToCrate, removeFromCrate, release],
  );

  const handlePillClick = usePillClickHandler({
    category: "releaseCard",
    onExitRandomMode,
  });

  return release ? (
    <ReleaseNotesEditorProvider release={release}>
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
          {release.rating > 0 && (
            <div
              className={styles.ratingBadge}
              title={`Rating: ${release.rating}/5`}
            >
              <StarIcon className={styles.starIcon} />
              {release.rating}
            </div>
          )}
          {thumbUrl && (
            <Image
              src={thumbUrl}
              height={96}
              width={96}
              quality={85}
              alt={release.basic_information.title}
              loading="lazy"
              className={styles.releaseImage}
              style={{
                maxWidth: "100%",
                position: "relative",
                zIndex: 2,
                filter: "none",
              }}
              sizes="96px"
            />
          )}
        </div>
        <div className={styles.contentContainer}>
          <div className={styles.mainContent}>
            <ReleaseCardCatalog
              catno={catno}
              className={metaStyles.catalogRowMobile}
            />
            <div className={styles.releaseInfo}>
              <ReleaseCardTitle
                artists={artists}
                title={title}
                releaseUrl={releaseUrl}
                resourceUrl={resource_url}
                className={titleStyles.titleGroupMobile}
              />
              <ReleaseCardMeta
                labelName={labels[0]?.name}
                labelUrl={labelUrl}
                year={year}
                className={metaStyles.metaLineMobile}
              />
            </div>
            <ReleaseNotes
              release={release}
              variant="displayOnly"
              className={notesStyles.notesCardMobile}
            />
          </div>
          <HorizontalScrollRow className={styles.genresContainer}>
            {releaseFormats &&
              releaseFormats.length > 0 &&
              getReleaseFormatTags(releaseFormats).map((formatName) => (
                <button
                  key={formatName}
                  type="button"
                  className={classNames(
                    "pill",
                    "pillFormat",
                    styles.formatPill,
                    {
                      pillSelected: selectedFormats.includes(formatName),
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
        </div>
        <div className={styles.actionButtonsContainer}>
          {releaseUrl && (
            <div className={styles.actionSlot}>
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.discogsButton}
                onClick={() => {
                  trackEvent("releaseClicked", {
                    action: "releaseClicked",
                    category: "home",
                    label: "Release Clicked",
                    value: resource_url,
                  });
                }}
                aria-label="View on Discogs"
                title="View on Discogs"
              >
                <ExternalLinkIcon className={styles.externalLinkIcon} />
              </a>
            </div>
          )}
          <ReleaseNotesCardAction variant="mobile" />
          <div className={styles.actionSlot}>
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
      </div>
    </ReleaseNotesEditorProvider>
  ) : null;
};

export const MobileReleaseCard = memo(MobileReleaseCardComponent);
