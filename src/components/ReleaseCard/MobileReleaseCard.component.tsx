import classNames from "classnames";
import Image from "next/image";
import { memo } from "react";
import { HorizontalScrollRow } from "src/components/HorizontalScrollRow/HorizontalScrollRow.component";
import { ReleaseNotesEditorProvider } from "src/components/ReleaseNotes/ReleaseNotesEditor.context";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import { useReleaseCardOpenHandler } from "src/hooks/useReleaseCardOpenHandler.hook";
import type { ReleaseCardProps as BaseReleaseCardProps } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getReleaseActivateProps } from "src/utils/releaseActivateProps";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import styles from "./MobileReleaseCard.module.css";
import {
  ReleaseCardCatalog,
  ReleaseCardMeta,
} from "./ReleaseCardMeta.component";
import metaStyles from "./ReleaseCardMeta.module.css";
import { ReleaseCardOverlayActions } from "./ReleaseCardOverlayActions.component";
import { ReleaseCardTitle } from "./ReleaseCardTitle.component";
import titleStyles from "./ReleaseCardTitle.module.css";

type MobileReleaseCardProps = BaseReleaseCardProps & {
  showOverlayActions?: boolean;
  rootTestId?: string;
};

const MobileReleaseCardComponent = ({
  release,
  inActiveCrate = false,
  isHighlighted = false,
  isRandomMode = false,
  onExitRandomMode,
  onReleaseClick,
  priority = false,
  showOverlayActions = true,
  rootTestId = "fmdMobileReleaseCard",
}: MobileReleaseCardProps) => {
  "use memo";
  const selectedStyles = useSelectedStyles();
  const selectedFormats = useSelectedFormats();
  const {
    labels,
    year,
    artists,
    title,
    thumb,
    cover_image,
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
  const genreStyleTags = getReleaseGenreStyleTags(release.basic_information);

  const handlePillClick = usePillClickHandler({
    onExitRandomMode,
  });

  const formatPills =
    releaseFormats && releaseFormats.length > 0
      ? getReleaseFormatTags(releaseFormats).map((formatName) =>
          showOverlayActions ? (
            <button
              key={formatName}
              type="button"
              className={classNames("pill", "pillFormat", styles.formatPill, {
                pillSelected: selectedFormats.includes(formatName),
              })}
              onClick={(e) =>
                handlePillClick({
                  event: e,
                  value: formatName,
                  type: "format",
                })
              }
              aria-label={`Filter by ${formatName} format`}
            >
              {formatName}
            </button>
          ) : (
            <span
              key={formatName}
              className={classNames("pill", "pillFormat", styles.formatPill)}
            >
              {formatName}
            </span>
          ),
        )
      : null;

  const genrePills = genreStyleTags.map((tag) =>
    showOverlayActions ? (
      <button
        key={tag}
        type="button"
        className={classNames("pill", "pillStyle", styles.stylePill, {
          pillSelected: selectedStyles.includes(tag),
        })}
        onClick={(e) =>
          handlePillClick({
            event: e,
            value: tag,
            type: "style",
          })
        }
        aria-label={`Filter by ${tag}`}
      >
        {tag}
      </button>
    ) : (
      <span
        key={tag}
        className={classNames("pill", "pillStyle", styles.stylePill)}
      >
        {tag}
      </span>
    ),
  );

  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseCardOpenHandler({
      release,
      onReleaseClick,
    });

  const imageActivateProps = canOpen
    ? getReleaseActivateProps({
        onActivate: openRelease,
        ariaLabel: `Open release details for ${title}`,
        onFocus: prefetchReleaseOpen,
      })
    : undefined;

  if (!release) {
    return null;
  }

  const cardShell = (
    <div
      className={classNames(styles.releaseCard, {
        [styles.highlighted]: isHighlighted,
        [styles.inCrate]: inActiveCrate,
        [styles.randomMode]: isRandomMode,
      })}
      data-testid={rootTestId}
      {...definedProps(prefetchPointerProps ?? {})}
    >
      <div
        className={styles.imageContainer}
        {...definedProps(imageActivateProps ?? {})}
      >
        {thumbUrl && (
          <Image
            src={thumbUrl}
            height={96}
            width={96}
            quality={85}
            alt={release.basic_information.title}
            {...(priority ? { priority: true } : { loading: "lazy" as const })}
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
          <ReleaseCardCatalog catno={catno} className={metaStyles.catalogRow} />
          <div className={styles.releaseInfo}>
            <ReleaseCardTitle
              artists={artists}
              title={title}
              releaseUrl={releaseUrl}
              className={titleStyles.titleGroupMobile}
            />
            <ReleaseCardMeta
              labelName={labels[0]?.name}
              labelUrl={labelUrl}
              year={year}
              className={metaStyles.metaLineMobile}
            />
          </div>
        </div>
        <HorizontalScrollRow className={styles.genresContainer}>
          {formatPills}
          {genrePills}
        </HorizontalScrollRow>
      </div>
      {showOverlayActions ? (
        <div className={styles.actionButtonsContainer}>
          <ReleaseCardOverlayActions
            release={release}
            releaseUrl={releaseUrl}
            layout="vertical"
            notesVariant="mobile"
            {...definedProps({
              onReleaseOpen: canOpen ? openRelease : undefined,
            })}
          />
        </div>
      ) : null}
    </div>
  );

  if (!showOverlayActions) {
    return cardShell;
  }

  return (
    <ReleaseNotesEditorProvider release={release}>
      {cardShell}
    </ReleaseNotesEditorProvider>
  );
};

export const MobileReleaseCard = memo(MobileReleaseCardComponent);
