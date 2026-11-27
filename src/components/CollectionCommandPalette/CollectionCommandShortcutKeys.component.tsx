import {
  formatShortcutKeyForDisplay,
  parseKeyboardShortcut,
} from "src/utils/keyboardShortcut";
import styles from "./CollectionCommandPalette.module.css";

type CollectionCommandShortcutKeysProps = {
  shortcut: string;
};

export const CollectionCommandShortcutKeys = ({
  shortcut,
}: CollectionCommandShortcutKeysProps) => {
  const parts = parseKeyboardShortcut(shortcut);

  return (
    <span className={styles.shortcutKeys} aria-hidden>
      {parts.map((part) => (
        <kbd key={part} className={styles.itemKbd}>
          {formatShortcutKeyForDisplay(part)}
        </kbd>
      ))}
    </span>
  );
};
