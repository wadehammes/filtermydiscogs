import classNames from "classnames";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { HorizontalScrollRow } from "src/components/shared/HorizontalScrollRow/HorizontalScrollRow.component";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import styles from "./ReleaseCard.module.css";
import {
  ReleaseCardCatalog,
  ReleaseCardMeta,
} from "./ReleaseCardMeta.component";
import { ReleaseCardTitle } from "./ReleaseCardTitle.component";

interface ReleaseCardContentProps {
  release: DiscogsRelease;
  releaseUrl: string | null;
  labelUrl: string | null;
  onExitRandomMode?: () => void;
  onReleaseOpen?: () => void;
}

export function ReleaseCardContent({
  release,
  releaseUrl,
  labelUrl,
  onExitRandomMode,
  onReleaseOpen,
}: ReleaseCardContentProps) {
  const selectedStyles = useSelectedStyles();
  const selectedFormats = useSelectedFormats();
  const handlePillClick = usePillClickHandler({
    category: "releaseCard",
    onExitRandomMode,
  });

  const {
    labels,
    year,
    artists,
    title,
    resource_url,
    styles: releaseStyles,
    formats: releaseFormats,
  } = release.basic_information;

  const catno = labels[0]?.catno ? String(labels[0].catno) : null;

  return (
    <div className={styles.contentContainer}>
      <div className={styles.mainContent}>
        <ReleaseCardCatalog catno={catno} />
        <ReleaseCardTitle
          artists={artists}
          title={title}
          releaseUrl={releaseUrl}
          resourceUrl={resource_url}
          analyticsCategory="home"
          {...definedProps({ onReleaseOpen })}
        />
        <ReleaseCardMeta
          labelName={labels[0]?.name}
          labelUrl={labelUrl}
          year={year}
        />
        <ReleaseNotes release={release} variant="displayOnly" />
      </div>
      <HorizontalScrollRow className={styles.genresContainer}>
        {releaseFormats &&
          releaseFormats.length > 0 &&
          getReleaseFormatTags(releaseFormats).map((formatName) => (
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
  );
}
