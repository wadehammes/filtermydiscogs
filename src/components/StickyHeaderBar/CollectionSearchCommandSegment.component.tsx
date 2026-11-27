"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import {
  COLLECTION_COMMAND_CHIP_LABEL,
  DEFAULT_COLLECTION_COMMAND_SHORTCUT,
} from "src/constants/collectionCommand.constants";
import { useAuth } from "src/context/auth.context";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { SparklesThinIcon } from "src/styles/icons/SparklesThinIcon.component";
import tooltipStyles from "src/styles/modules/base-ui-tooltip.module.css";
import {
  buildCollectionCommandOpenAriaLabel,
  buildCollectionCommandOpenTooltip,
} from "src/utils/buildCollectionCommandOpenTooltip";
import { openCollectionCommandPalette } from "src/utils/collectionCommandPaletteBridge";
import styles from "./CollectionSearchCommandSegment.module.css";

type CollectionSearchCommandSegmentProps = {
  disabled?: boolean;
  className?: string;
};

export const CollectionSearchCommandSegment = ({
  disabled = false,
  className,
}: CollectionSearchCommandSegmentProps) => {
  const { state: authState } = useAuth();
  const { data: preferences } = useUserPreferencesQuery({
    userId: authState.userId,
    enabled: authState.isAuthenticated && !authState.isCheckingAuth,
  });

  const paletteEnabled = preferences?.collectionCommandPaletteEnabled ?? true;
  const shortcut =
    preferences?.collectionCommandPaletteShortcut ??
    DEFAULT_COLLECTION_COMMAND_SHORTCUT;
  const tooltipText = buildCollectionCommandOpenTooltip(shortcut);
  const ariaLabel = buildCollectionCommandOpenAriaLabel(shortcut);

  const handleOpenCommand = () => {
    openCollectionCommandPalette();
  };

  return (
    <div
      className={classNames(styles.segment, className)}
      data-testid="fmdCollectionSearchCommandSegment"
    >
      <SearchBar
        placeholder="Search your collection..."
        disabled={disabled}
        embedded
        className={styles.search}
      />
      {paletteEnabled ? (
        <Tooltip.Provider closeDelay={80} delay={300}>
          <Tooltip.Root>
            <Tooltip.Trigger
              type="button"
              className={styles.commandChip}
              disabled={disabled}
              data-testid="fmdCollectionCommandOpenChip"
              aria-label={ariaLabel}
              onClick={handleOpenCommand}
            >
              <span className={styles.chipInner} aria-hidden>
                <SparklesThinIcon className={styles.chipIcon} />
                <span className={styles.chipLabel}>
                  {COLLECTION_COMMAND_CHIP_LABEL}
                </span>
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner
                align="center"
                className={tooltipStyles.tooltippositioner}
                side="top"
              >
                <Tooltip.Popup className={tooltipStyles.tooltippopupwide}>
                  {tooltipText}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      ) : null}
    </div>
  );
};
