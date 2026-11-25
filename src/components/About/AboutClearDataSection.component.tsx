"use client";

import classNames from "classnames";
import Link from "next/link";
import Button from "src/components/Button/Button.component";
import { ClearAllDataConfirmDialog } from "src/components/ClearAllDataConfirmDialog/ClearAllDataConfirmDialog.component";
import type { ABOUT_DATA_DELETION_ITEMS } from "src/constants/about.constants";
import {
  CLEAR_ALL_DATA_ABOUT_INTRO,
  CLEAR_ALL_DATA_ACTION_LABEL,
  CLEAR_ALL_DATA_ACTION_LOADING_LABEL,
  CLEAR_ALL_DATA_LOGIN_REQUIRED_NOTE,
  CLEAR_ALL_DATA_TITLE,
} from "src/constants/clearData.constants";
import { useConfirmClearAllUserData } from "src/hooks/useConfirmClearAllUserData.hook";
import typography from "src/styles/modules/typography.module.css";
import styles from "./About.module.css";

type AboutClearDataSectionProps = {
  deletionItems: typeof ABOUT_DATA_DELETION_ITEMS;
};

export const AboutClearDataSection = ({
  deletionItems,
}: AboutClearDataSectionProps) => {
  const {
    closeClearDataDialog,
    handleConfirmClear,
    isAuthenticated,
    isClearDataDialogOpen,
    isClearing,
    openClearDataDialog,
  } = useConfirmClearAllUserData();

  return (
    <section
      className={classNames(styles.tile, styles.tileClearData)}
      aria-labelledby="about-data"
    >
      <div className={styles.clearDataIntro} data-prose-flow>
        <p className={typography.sectionEyebrow}>Data</p>
        <h2 id="about-data" className={styles.tileTitle}>
          {CLEAR_ALL_DATA_TITLE}
        </h2>
        <p>{CLEAR_ALL_DATA_ABOUT_INTRO}</p>
      </div>

      <ul className={styles.clearDataList}>
        {deletionItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className={styles.clearDataFooter}>
        <Button
          variant="danger"
          size="md"
          onPress={openClearDataDialog}
          disabled={isClearing || !isAuthenticated}
          aria-label={CLEAR_ALL_DATA_ACTION_LABEL}
        >
          {isClearing
            ? CLEAR_ALL_DATA_ACTION_LOADING_LABEL
            : CLEAR_ALL_DATA_ACTION_LABEL}
        </Button>
        <ClearAllDataConfirmDialog
          isOpen={isClearDataDialogOpen}
          onClose={closeClearDataDialog}
          onConfirm={() => {
            void handleConfirmClear();
          }}
          isConfirming={isClearing}
        />
        <div className={styles.clearDataMeta}>
          {!isAuthenticated && (
            <p className={styles.clearDataNote}>
              {CLEAR_ALL_DATA_LOGIN_REQUIRED_NOTE}
            </p>
          )}
          <p className={styles.clearDataNote}>
            <Link href="/legal" className={styles.link}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
