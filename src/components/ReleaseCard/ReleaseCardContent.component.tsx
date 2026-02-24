import classNames from "classnames";
import { trackEvent } from "src/analytics/analytics";
import { useFilters } from "src/context/filters.context";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import type { DiscogsRelease } from "src/types";
import { formatDate } from "src/utils/dateHelpers";
import { getResourceUrl } from "src/utils/helpers";
import styles from "./ReleaseCard.module.css";

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
  const { state: filtersState } = useFilters();
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

  const dateAdded = release.date_added ? formatDate(release.date_added) : null;

  return (
    <div className={styles.contentContainer}>
      <div className={styles.mainContent}>
        <h3 className={styles.title}>
          {artists.map((artist, index) => {
            const artistUrl = getResourceUrl({
              resourceUrl: artist.resource_url,
              type: "artist",
            });
            return (
              <span key={artist.id ?? `${artist.name}-${index}`}>
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
          {releaseUrl ? (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("releaseClicked", {
                  action: "releaseClicked",
                  category: "home",
                  label: "Release Clicked",
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
              {(() => {
                const catno = labels[0]?.catno;
                const catnoStr = catno ? String(catno) : "";
                return (
                  <>
                    {labels[0]?.name && catnoStr ? " • " : ""}
                    {catnoStr}
                    {(labels[0]?.name || catnoStr) && year !== 0 ? " • " : ""}
                  </>
                );
              })()}
              {year !== 0 ? year : ""}
            </p>
          )}
          {dateAdded && <p className={styles.meta}>Date Added: {dateAdded}</p>}
        </div>
      </div>
      <div className={styles.genresContainer}>
        {releaseFormats &&
          releaseFormats.length > 0 &&
          Array.from(new Set(releaseFormats.map((format) => format.name))).map(
            (formatName) => (
              <button
                key={formatName}
                type="button"
                className={classNames("pill", "pillFormat", styles.formatPill, {
                  pillSelected:
                    filtersState.selectedFormats.includes(formatName),
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
            ),
          )}
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
  );
}
