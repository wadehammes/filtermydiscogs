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

  const sortControlsTitle =
    "Sort by sets the main order. Then by breaks ties on the same value—for date added, ties are the same UTC calendar day.";

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
        <div className={styles.sortFilterGroup} title={sortControlsTitle}>
          {sortSelects}
        </div>
      </div>
    );
  }

  return (
    <div
      className={classNames(styles.sortFilterGroup, className)}
      data-testid="fmdCollectionSortControls"
      title={sortControlsTitle}
    >
      {sortSelects}
    </div>
  );
};
