"use client";

import { useEffect, useState } from "react";
import Button from "src/components/Button/Button.component";
import { FormDialog } from "src/components/FormDialog/FormDialog.component";
import { QuestionThinIcon } from "src/styles/icons/QuestionThinIcon.component";
import {
  PLAYBACK_SKIP_HELP_DIALOG_TITLE,
  PLAYBACK_SKIP_HELP_INTRO,
  PLAYBACK_SKIP_HELP_REPORT_NOTE,
  PLAYBACK_SKIP_HELP_SECTIONS,
  PLAYBACK_SKIP_HELP_TRIGGER_LABEL,
} from "src/utils/playbackSkipHelpCopy";
import {
  openPlaybackSkipHelpDialog,
  registerPlaybackSkipHelpDialogOpen,
} from "src/utils/playbackSkipHelpDialogBridge";
import styles from "./PlaybackSkipHelpDialog.module.css";

export type PlaybackSkipHelpDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const PlaybackSkipHelpDialog = ({
  open,
  onClose,
}: PlaybackSkipHelpDialogProps) => {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      panelWidth="sm"
      testId="fmdPlaybackSkipHelpDialog"
      title={PLAYBACK_SKIP_HELP_DIALOG_TITLE}
      description={PLAYBACK_SKIP_HELP_INTRO}
      descriptionClassName={styles.intro}
      footer={
        <Button type="button" variant="primary" onPress={onClose}>
          Got it
        </Button>
      }
    >
      <dl className={styles.sectionList}>
        {PLAYBACK_SKIP_HELP_SECTIONS.map((section) => (
          <div key={section.reason} className={styles.section}>
            <dt className={styles.reason}>{section.reason}</dt>
            <dd className={styles.detail}>{section.detail}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.reportNote}>{PLAYBACK_SKIP_HELP_REPORT_NOTE}</p>
    </FormDialog>
  );
};

export const PlaybackSkipHelpDialogHost = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return registerPlaybackSkipHelpDialogOpen(() => {
      setOpen(true);
    });
  }, []);

  return (
    <PlaybackSkipHelpDialog
      open={open}
      onClose={() => {
        setOpen(false);
      }}
    />
  );
};

export const PlaybackSkipHelpToastTrigger = () => {
  return (
    <button
      className="fmd-playback-skip-help-trigger"
      onClick={() => {
        openPlaybackSkipHelpDialog();
      }}
      title={PLAYBACK_SKIP_HELP_TRIGGER_LABEL}
      type="button"
      aria-label={PLAYBACK_SKIP_HELP_TRIGGER_LABEL}
    >
      <QuestionThinIcon className="fmd-playback-skip-help-trigger-icon" />
    </button>
  );
};
