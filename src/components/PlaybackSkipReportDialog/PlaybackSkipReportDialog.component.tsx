"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import {
  FormDialog,
  formDialogStyles,
} from "src/components/FormDialog/FormDialog.component";
import {
  PLAYBACK_SKIP_USER_REPORT_NOTE_MAX_LENGTH,
  type PlaybackSkipUserReportFormInput,
  type PlaybackSkipUserReportFormValues,
  parsePlaybackSkipUserReportForm,
  playbackSkipUserReportFormResolverSchema,
} from "src/lib/validation/playbackSkipUserReport.schemas";
import modalFormFieldStyles from "src/styles/modules/modal-form-field.module.css";
import modalInputStyles from "src/styles/modules/modal-input.module.css";
import type { PlaybackSkipLogEntry } from "src/utils/playbackSkippedTrackLog";
import {
  completePlaybackSkipUserReport,
  registerPlaybackSkipReportDialogOpen,
} from "src/utils/playbackSkipUserReportDialogBridge";
import { PLAYBACK_SKIP_USER_REPORT_CATEGORY_OPTIONS } from "src/utils/playbackSkipUserReportLabels";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./PlaybackSkipReportDialog.module.css";

const PLAYBACK_SKIP_REPORT_FORM_ID = "fmdPlaybackSkipReportForm";

export type PlaybackSkipReportDialogProps = {
  open: boolean;
  entry: PlaybackSkipLogEntry | null;
  onClose: () => void;
  onSubmitUserReport: (
    entry: PlaybackSkipLogEntry,
    report: PlaybackSkipUserReportFormValues,
  ) => void;
};

export const PlaybackSkipReportDialog = ({
  open,
  entry,
  onClose,
  onSubmitUserReport,
}: PlaybackSkipReportDialogProps) => {
  const categoryGroupId = useId();
  const noteFieldId = useId();

  const { register, handleSubmit, reset, formState } =
    useForm<PlaybackSkipUserReportFormInput>({
      resolver: zodResolver(playbackSkipUserReportFormResolverSchema),
      defaultValues: {
        category: undefined,
        note: "",
      },
    });

  useEffect(() => {
    if (!open) {
      reset({
        category: undefined,
        note: "",
      });
    }
  }, [open, reset]);

  const trackLabel = entry?.trackLabel ?? "";

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      testId="fmdPlaybackSkipReportDialog"
      title="Report skip error"
      description={
        entry ? (
          <>
            <span className={styles.trackLabel}>{trackLabel}</span>
            <span className={styles.reason}>{entry.reason}</span>
          </>
        ) : null
      }
      footer={
        <>
          <Button type="button" variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            form={PLAYBACK_SKIP_REPORT_FORM_ID}
            type="submit"
            variant="primary"
          >
            Send report
          </Button>
        </>
      }
    >
      <form
        id={PLAYBACK_SKIP_REPORT_FORM_ID}
        className={styles.form}
        onSubmit={handleSubmit((values) => {
          if (!entry) {
            return;
          }

          onSubmitUserReport(entry, parsePlaybackSkipUserReportForm(values));
          onClose();
        })}
      >
        <fieldset className={styles.categoryFieldset} id={categoryGroupId}>
          <legend
            className={classNames(
              formDialogStyles.label,
              styles.categoryLegend,
            )}
          >
            What went wrong?
          </legend>
          <ul className={styles.categoryList}>
            {PLAYBACK_SKIP_USER_REPORT_CATEGORY_OPTIONS.map((option) => {
              const inputId = `${categoryGroupId}-${option.value}`;

              return (
                <li key={option.value}>
                  <label
                    className={formDialogStyles.checkboxLabel}
                    htmlFor={inputId}
                  >
                    <input
                      {...register("category")}
                      className={formDialogStyles.checkbox}
                      data-1p-ignore
                      id={inputId}
                      type="radio"
                      value={option.value}
                    />
                    <span>{option.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {formState.errors.category?.message ? (
            <p className={styles.fieldError} role="alert">
              {formState.errors.category.message}
            </p>
          ) : null}
        </fieldset>
        <FormDialog.Field label="Details (optional)" htmlFor={noteFieldId}>
          <textarea
            {...register("note")}
            className={validatedFieldClass(
              modalFormFieldStyles.textarea,
              modalInputStyles.textarea,
            )}
            data-1p-ignore
            id={noteFieldId}
            maxLength={PLAYBACK_SKIP_USER_REPORT_NOTE_MAX_LENGTH}
            placeholder="Anything else we should know?"
            rows={3}
          />
        </FormDialog.Field>
      </form>
    </FormDialog>
  );
};

export const PlaybackSkipReportDialogHost = () => {
  const [pendingEntry, setPendingEntry] = useState<PlaybackSkipLogEntry | null>(
    null,
  );

  useEffect(() => {
    return registerPlaybackSkipReportDialogOpen((entry) => {
      setPendingEntry(entry);
    });
  }, []);

  return (
    <PlaybackSkipReportDialog
      entry={pendingEntry}
      open={pendingEntry !== null}
      onClose={() => {
        setPendingEntry(null);
      }}
      onSubmitUserReport={completePlaybackSkipUserReport}
    />
  );
};
