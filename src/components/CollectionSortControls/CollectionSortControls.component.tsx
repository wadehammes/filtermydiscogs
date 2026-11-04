import classNames from "classnames";
import { useMemo } from "react";
import Select from "src/components/Select/Select.component";
import type {
  CollectionSortSecondary,
  SortValues,
} from "src/constants/sortValues";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import {
  getPrimarySortSelectOptions,
  getThenBySortSelectOptions,
} from "src/utils/collectionSortOptions";
import styles from "./CollectionSortControls.module.css";

const PRIMARY_SORT_SELECT_OPTIONS = getPrimarySortSelectOptions();

const SORT_THEN_BY_HINT =
  "Then by only changes order when two releases tie on Sort by. For Date Added, adds on the same day count as a tie.";

export const CollectionSortControlsJoin = () => (
  <div
    className={styles.sortJoin}
    data-testid="fmdCollectionSortJoin"
    aria-hidden
  >
    <ChevronRightThinIcon className={styles.sortJoinChevron} />
  </div>
);

export type CollectionSortControlsProps = {
  primarySort: SortValues;
  secondarySort: CollectionSortSecondary;
  onPrimarySortChange: (value: string | string[]) => void;
  onSecondarySortChange: (value: string | string[]) => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
};

export const CollectionSortControls = ({
  primarySort,
  secondarySort,
  onPrimarySortChange,
  onSecondarySortChange,
  disabled = false,
  showLabel = false,
  className,
}: CollectionSortControlsProps) => {
  "use memo";

  const secondaryOptions = useMemo(
    () => getThenBySortSelectOptions(primarySort),
    [primarySort],
  );

  const sortSelects = (
    <>
      <Select
        label="Sort by"
        options={PRIMARY_SORT_SELECT_OPTIONS}
        value={primarySort}
        onChange={onPrimarySortChange}
        disabled={disabled}
        placeholder="Select sort..."
        popupClassName={styles.sortSelectPopup}
      />
      <CollectionSortControlsJoin />
      <Select
        label="Then by"
        options={secondaryOptions}
        value={secondarySort}
        onChange={onSecondarySortChange}
        disabled={disabled}
        placeholder="None"
        popupClassName={styles.sortSelectPopup}
      />
    </>
  );

  if (showLabel) {
    return (
      <div
        className={classNames(styles.sortControlsLabeled, className)}
        data-testid="fmdCollectionSortControls"
      >
        <div className={styles.sortLabelRow}>
          <span className={styles.sortFieldLabel}>Sort by</span>
          <span className={styles.sortLabelJoinGap} aria-hidden />
          <span className={styles.sortFieldLabel}>Then by</span>
        </div>
        <p className={styles.sortThenByHint}>{SORT_THEN_BY_HINT}</p>
        <div className={styles.sortFilterGroup} title={SORT_THEN_BY_HINT}>
          {sortSelects}
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames(styles.sortFilterGroup, className)}
      data-testid="fmdCollectionSortControls"
      title={SORT_THEN_BY_HINT}
    >
      {sortSelects}
    </div>
  );
};
