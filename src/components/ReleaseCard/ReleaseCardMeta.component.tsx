import classNames from "classnames";
import { formatDate } from "src/utils/dateHelpers";
import styles from "./ReleaseCardMeta.module.css";

interface ReleaseCardCatalogProps {
  catno?: string | null | undefined;
  className?: string | undefined;
}

export function ReleaseCardCatalog({
  catno,
  className,
}: ReleaseCardCatalogProps) {
  const catnoStr = catno ? String(catno) : "";

  if (!catnoStr) {
    return null;
  }

  return (
    <div className={classNames(styles.catalogRow, className)}>
      <span className={styles.metaCatalog}>{catnoStr}</span>
    </div>
  );
}

interface ReleaseCardMetaProps {
  labelName?: string | undefined;
  labelUrl?: string | null | undefined;
  year?: number | undefined;
  dateAdded?: string | null | undefined;
  className?: string | undefined;
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
  className,
}: ReleaseCardMetaProps) {
  const showYear = year !== undefined && year !== 0;
  const formattedDateAdded = dateAdded ? formatDate(dateAdded) : null;
  const showLabel = Boolean(labelName);
  const hasContent = showLabel || showYear || formattedDateAdded;

  if (!hasContent) {
    return null;
  }

  return (
    <p className={classNames(styles.metaLine, className)}>
      {showLabel &&
        (labelUrl ? (
          <a
            href={labelUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`View ${labelName} on Discogs`}
            onClick={(e) => {
              e.stopPropagation();
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
