"use client";

import { useId } from "react";
import { ModalToolbar } from "src/components/ModalToolbar/ModalToolbar.component";
import { ScrollModal } from "src/components/ScrollModal/ScrollModal.component";
import { DEFAULT_COLLECTION_COMMAND_SHORTCUT } from "src/constants/collectionCommand.constants";
import {
  resolveWhatsNewBulletText,
  WHATS_NEW_BULLET_BADGE_LABEL,
  WHATS_NEW_MODAL_TITLE,
  WHATS_NEW_OTHER_IMPROVEMENTS,
  WHATS_NEW_RELEASES,
  type WhatsNewBulletBadge,
} from "src/constants/whatsNew.constants";
import { formatShortcutForDisplay } from "src/utils/keyboardShortcut";
import styles from "./WhatsNewModal.module.css";

const WHATS_NEW_BADGE_CLASS: Record<WhatsNewBulletBadge, string> = {
  new: styles.badgeNew,
  fixed: styles.badgeFixed,
  improved: styles.badgeImproved,
};

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal = ({ isOpen, onClose }: WhatsNewModalProps) => {
  const titleId = useId();

  return (
    <ScrollModal
      abovePlaybackDock
      ariaLabelledBy={titleId}
      contentClassName={styles.content}
      isOpen={isOpen}
      onClose={onClose}
      panelClassName={styles.modal}
      testId="fmdWhatsNewModal"
      header={
        <ModalToolbar
          onClose={onClose}
          title={WHATS_NEW_MODAL_TITLE}
          titleId={titleId}
        />
      }
    >
      <ul className={styles.releaseList}>
        {WHATS_NEW_RELEASES.map((release) => (
          <li key={release.version} className={styles.release}>
            <h3 className={styles.releaseHeading}>{release.version}</h3>
            <ul className={styles.bulletList}>
              {release.highlights.map((bullet) => (
                <li key={bullet.id} className={styles.bullet}>
                  <span className={WHATS_NEW_BADGE_CLASS[bullet.badge]}>
                    {WHATS_NEW_BULLET_BADGE_LABEL[bullet.badge]}
                  </span>
                  <span className={styles.bulletText}>
                    {resolveWhatsNewBulletText(
                      bullet,
                      formatShortcutForDisplay(
                        DEFAULT_COLLECTION_COMMAND_SHORTCUT,
                      ),
                    )}
                  </span>
                </li>
              ))}
              <li className={styles.otherImprovements}>
                <span className={styles.bulletText}>
                  {WHATS_NEW_OTHER_IMPROVEMENTS}
                </span>
              </li>
            </ul>
          </li>
        ))}
      </ul>
    </ScrollModal>
  );
};
