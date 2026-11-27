import { COLLECTION_COMMAND_OPEN_TOOLTIP_LEDE } from "src/constants/collectionCommand.constants";
import { formatShortcutChipAbbreviation } from "src/utils/keyboardShortcut";

export const buildCollectionCommandOpenTooltip = (shortcut: string): string =>
  `${COLLECTION_COMMAND_OPEN_TOOLTIP_LEDE} (${formatShortcutChipAbbreviation(shortcut)})`;

export const buildCollectionCommandOpenAriaLabel = (shortcut: string): string =>
  `Open collection command. ${buildCollectionCommandOpenTooltip(shortcut)}`;
