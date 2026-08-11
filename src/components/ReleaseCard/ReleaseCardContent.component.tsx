import classNames from "classnames";
import { HorizontalScrollRow } from "src/components/shared/HorizontalScrollRow/HorizontalScrollRow.component";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import type { DiscogsRelease } from "src/types";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
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
}

export function ReleaseCardContent({
  release,
  releaseUrl,
  labelUrl,
  onExitRandomMode,
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
    formats: releaseFormats,
  } = release.basic_information;

  const genreStyleTags = getReleaseGenreStyleTags(release.basic_information);
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
        />
        <ReleaseCardMeta
          labelName={labels[0]?.name}
          labelUrl={labelUrl}
          year={year}
        />
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
        {genreStyleTags.map((tag) => (
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
                eventLabel: "Genre Style Pill Clicked",
              })
            }
            aria-label={`Filter by ${tag}`}
          >
            {tag}
          </button>
        ))}
      </HorizontalScrollRow>
    </div>
  );
}
