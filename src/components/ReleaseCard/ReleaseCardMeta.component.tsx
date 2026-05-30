import { trackEvent } from "src/analytics/analytics";
import { formatDate } from "src/utils/dateHelpers";
import styles from "./ReleaseCardMeta.module.css";

interface ReleaseCardCatalogProps {
  catno?: string | null | undefined;
}

export function ReleaseCardCatalog({ catno }: ReleaseCardCatalogProps) {
  const catnoStr = catno ? String(catno) : "";

  if (!catnoStr) {
    return null;
  }

  return (
    <div className={styles.catalogRow}>
      <span className={styles.metaCatalog}>{catnoStr}</span>
    </div>
  );
}

interface ReleaseCardMetaProps {
  labelName?: string | undefined;
  labelUrl?: string | null | undefined;
  year?: number | undefined;
  dateAdded?: string | null | undefined;
  analyticsCategory?: "releaseCard" | "publicCrate" | "home" | undefined;
}

function MetaSeparator() {
  return (
    <span className={styles.metaSeparator} aria-hidden>
      ·
    </span>
  );
}

export function ReleaseCardMeta({
  labelName,
  labelUrl,
  year,
  dateAdded,
  analyticsCategory = "releaseCard",
}: ReleaseCardMetaProps) {
  const showYear = year !== undefined && year !== 0;
  const formattedDateAdded = dateAdded ? formatDate(dateAdded) : null;
  const showLabel = Boolean(labelName);
  const hasContent = showLabel || showYear || formattedDateAdded;

  if (!hasContent) {
    return null;
  }

  return (
    <p className={styles.metaLine}>
      {showLabel &&
        (labelUrl ? (
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`View ${labelName} on Discogs`}
            onClick={(e) => {
              e.stopPropagation();
              trackEvent("labelClicked", {
                action: "labelClicked",
                category: analyticsCategory,
                label: "Label Clicked",
                value: labelUrl,
              });
            }}
            className={styles.labelLink}
          >
            {labelName}
          </a>
        ) : (
          <span>{labelName}</span>
        ))}
      {showLabel && showYear && <MetaSeparator />}
      {showYear && <span>{year}</span>}
      {(showLabel || showYear) && formattedDateAdded && <MetaSeparator />}
      {formattedDateAdded && dateAdded && (
        <>
          Added <time dateTime={dateAdded}>{formattedDateAdded}</time>
        </>
      )}
    </p>
  );
}
