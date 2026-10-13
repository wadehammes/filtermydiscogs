"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Attachment } from "@sentry/core";
import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { FormDialog } from "src/components/FormDialog/FormDialog.component";
import { SUBMIT_BUG_REPORT_NAV_LABEL } from "src/constants/sentryUserFeedback.constants";
import {
  SENTRY_USER_FEEDBACK_ADD_SCREENSHOT_LABEL,
  SENTRY_USER_FEEDBACK_CHOOSE_IMAGE_LABEL,
  SENTRY_USER_FEEDBACK_MESSAGE_MAX_LENGTH,
  SENTRY_USER_FEEDBACK_REMOVE_SCREENSHOT_LABEL,
  SENTRY_USER_FEEDBACK_UPLOAD_IMAGE_HINT,
  SENTRY_USER_FEEDBACK_UPLOAD_IMAGE_LABEL,
} from "src/constants/sentryUserFeedbackForm.constants";
import { useAuth } from "src/context/auth.context";
import { captureSentryFeedbackScreenshot } from "src/lib/sentry/captureSentryFeedbackScreenshot.client";
import { isSentryFeedbackScreenshotSupported } from "src/lib/sentry/isSentryFeedbackScreenshotSupported.client";
import { readSentryFeedbackScreenshotFile } from "src/lib/sentry/readSentryFeedbackScreenshotFile.client";
import { submitSentryUserFeedback } from "src/lib/sentry/submitSentryUserFeedback.client";
import {
  type SentryUserFeedbackFormValues,
  sentryUserFeedbackFormSchema,
} from "src/lib/validation/sentryUserFeedback.schemas";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import modalFormFieldStyles from "src/styles/modules/modal-form-field.module.css";
import modalInputStyles from "src/styles/modules/modal-input.module.css";
import { registerSentryUserFeedbackDialogOpen } from "src/utils/sentryUserFeedbackDialogBridge";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./SentryUserFeedbackDialog.module.css";

const SENTRY_USER_FEEDBACK_FORM_ID = "fmdSentryUserFeedbackForm";

type SentryUserFeedbackScreenshotSectionProps = {
  screenshotPreviewUrl: string | undefined;
  screenshotCaptureSupported: boolean;
  uploadFieldId: string;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
  onClearScreenshot: () => void;
  onAddScreenshot: () => void;
  onUploadChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const SentryUserFeedbackScreenshotSection = ({
  screenshotPreviewUrl,
  screenshotCaptureSupported,
  uploadFieldId,
  uploadInputRef,
  onClearScreenshot,
  onAddScreenshot,
  onUploadChange,
}: SentryUserFeedbackScreenshotSectionProps) => {
  if (screenshotPreviewUrl) {
    return (
      <figure className={styles.screenshotPreview}>
        <Image
          alt="Screenshot preview"
          className={styles.screenshotImage}
          height={480}
          src={screenshotPreviewUrl}
          unoptimized
          width={640}
        />
        <figcaption>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onPress={onClearScreenshot}
          >
            {SENTRY_USER_FEEDBACK_REMOVE_SCREENSHOT_LABEL}
          </Button>
        </figcaption>
      </figure>
    );
  }

  if (screenshotCaptureSupported) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="md"
        onPress={onAddScreenshot}
      >
        {SENTRY_USER_FEEDBACK_ADD_SCREENSHOT_LABEL}
      </Button>
    );
  }

  return (
    <FormDialog.Field
      label={SENTRY_USER_FEEDBACK_UPLOAD_IMAGE_LABEL}
      htmlFor={uploadFieldId}
    >
      <div className={styles.fileUploadControl}>
        <input
          ref={uploadInputRef}
          accept="image/png,image/jpeg,image/webp"
          className={accessibilityStyles.visuallyHidden}
          data-1p-ignore
          id={uploadFieldId}
          type="file"
          onChange={onUploadChange}
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          onPress={() => {
            uploadInputRef.current?.click();
          }}
        >
          {SENTRY_USER_FEEDBACK_CHOOSE_IMAGE_LABEL}
        </Button>
        <p className={styles.fileUploadHint}>
          {SENTRY_USER_FEEDBACK_UPLOAD_IMAGE_HINT}
        </p>
      </div>
    </FormDialog.Field>
  );
};

export type SentryUserFeedbackDialogProps = {
  open: boolean;
  defaultName?: string;
  onClose: () => void;
  onSubmitFeedback?: (
    values: SentryUserFeedbackFormValues,
    screenshot?: Attachment,
  ) => void;
  onCaptureScreenshot?: () => Promise<Attachment | undefined>;
  screenshotCaptureSupported?: boolean;
};

export const SentryUserFeedbackDialog = ({
  open,
  defaultName = "",
  onClose,
  onSubmitFeedback = submitSentryUserFeedback,
  onCaptureScreenshot = captureSentryFeedbackScreenshot,
  screenshotCaptureSupported = isSentryFeedbackScreenshotSupported(),
}: SentryUserFeedbackDialogProps) => {
  const messageFieldId = useId();
  const nameFieldId = useId();
  const emailFieldId = useId();
  const uploadFieldId = useId();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [screenshotAttachment, setScreenshotAttachment] = useState<
    Attachment | undefined
  >(undefined);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<
    string | undefined
  >(undefined);
  const [screenshotError, setScreenshotError] = useState<string | undefined>(
    undefined,
  );
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  const { register, handleSubmit, reset, formState } =
    useForm<SentryUserFeedbackFormValues>({
      resolver: zodResolver(sentryUserFeedbackFormSchema),
      defaultValues: {
        message: "",
        name: defaultName,
        email: "",
      },
    });

  const clearScreenshot = useCallback(() => {
    setScreenshotAttachment(undefined);
    setScreenshotError(undefined);
    setScreenshotPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      return undefined;
    });
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }, []);

  const applyScreenshotAttachment = (attachment: Attachment) => {
    clearScreenshot();
    setScreenshotAttachment(attachment);
    const bytes = Uint8Array.from(
      typeof attachment.data === "string"
        ? new TextEncoder().encode(attachment.data)
        : attachment.data,
    );
    const blob = new Blob([bytes], {
      type: attachment.contentType ?? "image/png",
    });
    setScreenshotPreviewUrl(URL.createObjectURL(blob));
  };

  useEffect(() => {
    if (open) {
      reset({
        message: "",
        name: defaultName,
        email: "",
      });
      clearScreenshot();
    }
  }, [clearScreenshot, defaultName, open, reset]);

  useEffect(() => {
    return () => {
      if (screenshotPreviewUrl) {
        URL.revokeObjectURL(screenshotPreviewUrl);
      }
    };
  }, [screenshotPreviewUrl]);

  const handleAddScreenshot = async () => {
    setScreenshotError(undefined);
    setIsCapturingScreenshot(true);

    try {
      const attachment = await onCaptureScreenshot();
      if (attachment) {
        applyScreenshotAttachment(attachment);
      }
    } catch {
      setScreenshotError(
        "Could not capture a screenshot. Try uploading an image.",
      );
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleUploadChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    setScreenshotError(undefined);

    if (!file) {
      return;
    }

    const result = await readSentryFeedbackScreenshotFile(file);
    if (!result.ok) {
      setScreenshotError(result.errorMessage);
      event.target.value = "";
      return;
    }

    applyScreenshotAttachment(result.attachment);
  };

  const dialogOpen = open && !isCapturingScreenshot;

  return (
    <FormDialog
      open={dialogOpen}
      onClose={onClose}
      testId="fmdSentryUserFeedbackDialog"
      title={SUBMIT_BUG_REPORT_NAV_LABEL}
      description="Tell us what happened. You can attach a screenshot; session replay may also be included."
      footer={
        <>
          <Button type="button" variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button
            form={SENTRY_USER_FEEDBACK_FORM_ID}
            type="submit"
            variant="primary"
          >
            Send bug report
          </Button>
        </>
      }
    >
      <form
        id={SENTRY_USER_FEEDBACK_FORM_ID}
        className={styles.form}
        onSubmit={handleSubmit((values) => {
          onSubmitFeedback(values, screenshotAttachment);
          onClose();
        })}
      >
        <FormDialog.Field label="What went wrong?" htmlFor={messageFieldId}>
          <textarea
            {...register("message")}
            aria-invalid={Boolean(formState.errors.message)}
            className={validatedFieldClass(
              modalFormFieldStyles.textarea,
              modalInputStyles.textarea,
            )}
            data-1p-ignore
            id={messageFieldId}
            maxLength={SENTRY_USER_FEEDBACK_MESSAGE_MAX_LENGTH}
            placeholder="Steps to reproduce, what you expected, and what happened instead"
            rows={4}
          />
          {formState.errors.message?.message ? (
            <p className={styles.fieldError} role="alert">
              {formState.errors.message.message}
            </p>
          ) : null}
        </FormDialog.Field>
        <div className={styles.screenshotSection}>
          <SentryUserFeedbackScreenshotSection
            onAddScreenshot={() => {
              void handleAddScreenshot();
            }}
            onClearScreenshot={clearScreenshot}
            onUploadChange={(event) => {
              void handleUploadChange(event);
            }}
            screenshotCaptureSupported={screenshotCaptureSupported}
            screenshotPreviewUrl={screenshotPreviewUrl}
            uploadFieldId={uploadFieldId}
            uploadInputRef={uploadInputRef}
          />
          {screenshotError ? (
            <p className={styles.fieldError} role="alert">
              {screenshotError}
            </p>
          ) : null}
        </div>
        <FormDialog.Field
          label="Discogs Username (optional)"
          htmlFor={nameFieldId}
        >
          <input
            {...register("name")}
            className={validatedFieldClass(
              modalFormFieldStyles.input,
              modalInputStyles.field,
            )}
            data-1p-ignore
            id={nameFieldId}
            type="text"
            autoComplete="name"
          />
        </FormDialog.Field>
        <FormDialog.Field label="Email (optional)" htmlFor={emailFieldId}>
          <input
            {...register("email")}
            aria-invalid={Boolean(formState.errors.email)}
            className={validatedFieldClass(
              modalFormFieldStyles.input,
              modalInputStyles.field,
            )}
            data-1p-ignore
            id={emailFieldId}
            type="email"
            autoComplete="email"
          />
          {formState.errors.email?.message ? (
            <p className={styles.fieldError} role="alert">
              {formState.errors.email.message}
            </p>
          ) : null}
        </FormDialog.Field>
      </form>
    </FormDialog>
  );
};

export const SentryUserFeedbackDialogHost = () => {
  const {
    state: { username },
  } = useAuth();
  const [open, setOpen] = useState(false);
  const [defaultName, setDefaultName] = useState("");

  useEffect(() => {
    return registerSentryUserFeedbackDialogOpen(() => {
      setDefaultName(username ?? "");
      setOpen(true);
    });
  }, [username]);

  return (
    <SentryUserFeedbackDialog
      defaultName={defaultName}
      open={open}
      onClose={() => {
        setOpen(false);
      }}
    />
  );
};
