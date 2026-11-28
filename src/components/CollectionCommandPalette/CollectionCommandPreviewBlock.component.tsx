import {
  type CollectionCommandPreviewFact,
  formatCollectionCommandPreviewTail,
} from "src/utils/collectionCommandPreview";
import styles from "./CollectionCommandPalette.module.css";

type CollectionCommandPreviewBlockProps = {
  matchCount: number;
  facts: CollectionCommandPreviewFact[];
  confidenceNotes?: string | undefined;
};

export const CollectionCommandPreviewBlock = ({
  matchCount,
  facts,
  confidenceNotes,
}: CollectionCommandPreviewBlockProps) => {
  const tail = formatCollectionCommandPreviewTail(facts);

  return (
    <div className={styles.previewSection} role="status">
      <p className={styles.previewLine}>
        <span className={styles.previewLineCount}>
          {matchCount} release{matchCount === 1 ? "" : "s"}
        </span>
        {tail ? <span className={styles.previewLineTail}>{tail}</span> : null}
      </p>
      {confidenceNotes ? (
        <p className={styles.previewNote}>{confidenceNotes}</p>
      ) : null}
    </div>
  );
};
