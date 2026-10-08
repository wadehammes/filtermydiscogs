"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { type MouseEvent, useEffect, useId, useMemo } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { FormDialog } from "src/components/FormDialog/FormDialog.component";
import { useSaveTrackYoutubeOverrideMutation } from "src/hooks/mutations/useTrackStatsMutations";
import {
  type TrackYoutubeOverrideFormValues,
  trackYoutubeOverrideFormSchema,
} from "src/lib/validation/userTrack.schemas";
import { definedProps } from "src/utils/definedProps";
import { getDiscogsReleaseVideosUpdateUrl } from "src/utils/discogsReleaseUrls";
import { normalizeYoutubeVideoInput } from "src/utils/userTrack";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./TrackYoutubeOverrideDialog.module.css";
import { TrackYoutubeOverridePreview } from "./TrackYoutubeOverridePreview.component";
import { TrackYoutubeOverrideVideoMeta } from "./TrackYoutubeOverrideVideoMeta.component";

const TRACK_YOUTUBE_OVERRIDE_FORM_ID = "fmdTrackYoutubeOverrideForm";

const stopLinkPropagation = (event: MouseEvent<HTMLAnchorElement>) => {
  event.stopPropagation();
};

export type TrackYoutubeOverrideTarget = {
  trackKey: string;
  trackPosition: string;
  trackTitle: string;
  instanceId: string;
  artist?: string;
  releaseTitle?: string;
  discogsReleaseId?: number | null;
  initialYoutubeId?: string | null;
  hasDefaultYoutubeEmbed?: boolean;
  initialPreviewVideoId?: string | null;
};

export type TrackYoutubeOverrideDialogProps = {
  open: boolean;
  target: TrackYoutubeOverrideTarget | null;
  onClose: () => void;
  onSaved?: (youtubeId: string | null) => void;
};

export const TrackYoutubeOverrideDialog = ({
  open,
  target,
  onClose,
  onSaved,
}: TrackYoutubeOverrideDialogProps) => {
  const inputId = useId();
  const { mutate, isPending } = useSaveTrackYoutubeOverrideMutation();

  const { register, handleSubmit, reset, watch, formState } =
    useForm<TrackYoutubeOverrideFormValues>({
      resolver: zodResolver(trackYoutubeOverrideFormSchema),
      defaultValues: {
        youtubeInput: "",
      },
    });

  const youtubeInput = watch("youtubeInput");

  useEffect(() => {
    if (open && target) {
      reset({
        youtubeInput: target.initialYoutubeId ?? "",
      });
    } else if (!open) {
      reset({
        youtubeInput: "",
      });
    }
  }, [open, reset, target]);

  const trackHead = useMemo(() => {
    if (!target) {
      return "";
    }

    const position = target.trackPosition.trim();
    const title = target.trackTitle.trim();

    if (position && title) {
      return `${position} · ${title}`;
    }

    return title || position;
  }, [target]);

  const releaseLine = useMemo(() => {
    if (!target) {
      return "";
    }

    return [target.artist?.trim(), target.releaseTitle?.trim()]
      .filter((part): part is string => Boolean(part))
      .join(" · ");
  }, [target]);

  const buildMutationBody = (youtubeId: string | null) => {
    if (!target) {
      return null;
    }

    return {
      track_key: target.trackKey,
      track_position: target.trackPosition,
      track_title: target.trackTitle,
      instance_id: target.instanceId,
      youtube_id: youtubeId,
      ...definedProps({
        artist: target.artist,
        release_title: target.releaseTitle,
      }),
    };
  };

  if (!target) {
    return null;
  }

  const hasSavedOverride = Boolean(target.initialYoutubeId?.trim());
  const isReplacingExistingVideo =
    hasSavedOverride || Boolean(target.hasDefaultYoutubeEmbed);
  const dialogTitle = isReplacingExistingVideo
    ? "Use a different YouTube video"
    : "Add a YouTube video";
  const trimmedInput = youtubeInput.trim();
  const isRemoving = hasSavedOverride && trimmedInput.length === 0;
  const saveDisabled = isPending || (!isRemoving && trimmedInput.length === 0);
  const parsedInputVideoId = normalizeYoutubeVideoInput(youtubeInput);
  const previewVideoId =
    parsedInputVideoId ??
    (trimmedInput === "" && !isRemoving
      ? (target.initialPreviewVideoId ?? null)
      : null);
  const youtubeInputError = formState.errors.youtubeInput?.message;
  const discogsVideosUpdateUrl = getDiscogsReleaseVideosUpdateUrl(
    target.discogsReleaseId,
  );

  const handleSave = handleSubmit((values) => {
    const trimmed = values.youtubeInput.trim();

    if (hasSavedOverride && !trimmed) {
      const body = buildMutationBody(null);

      if (!body) {
        return;
      }

      mutate(body, {
        onSuccess: () => {
          onSaved?.(null);
          onClose();
        },
      });
      return;
    }

    const youtubeId = normalizeYoutubeVideoInput(values.youtubeInput);

    if (!youtubeId) {
      return;
    }

    const body = buildMutationBody(youtubeId);

    if (!body) {
      return;
    }

    mutate(body, {
      onSuccess: () => {
        onSaved?.(youtubeId);
        onClose();
      },
    });
  });

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      testId="fmdTrackYoutubeOverrideDialog"
      title={dialogTitle}
      description={
        <div className={styles.dialogContext}>
          {releaseLine ? (
            <p className={styles.dialogRelease}>{releaseLine}</p>
          ) : null}
          {trackHead ? <p className={styles.dialogTrack}>{trackHead}</p> : null}
        </div>
      }
      titleId={`${inputId}-title`}
      descriptionId={`${inputId}-description`}
      titleClassName={styles.dialogTitle}
      headerClassName={styles.dialogHeader}
      descriptionClassName={styles.dialogDescription}
      contentClassName={styles.dialogContent}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onPress={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={TRACK_YOUTUBE_OVERRIDE_FORM_ID}
            variant="primary"
            size="md"
            disabled={saveDisabled}
            isLoading={isPending}
            loadingText={isRemoving ? "Removing..." : "Saving..."}
          >
            {isRemoving ? "Remove link" : "Save link"}
          </Button>
        </>
      }
    >
      <form
        id={TRACK_YOUTUBE_OVERRIDE_FORM_ID}
        className={styles.fieldGroup}
        onSubmit={handleSave}
      >
        <FormDialog.Field
          label="YouTube URL or video ID"
          htmlFor={`${inputId}-youtube`}
        >
          <input
            data-1p-ignore
            id={`${inputId}-youtube`}
            className={validatedFieldClass(styles.input)}
            type="text"
            placeholder="https://www.youtube.com/watch?v=…"
            autoComplete="off"
            disabled={isPending}
            {...register("youtubeInput")}
          />
        </FormDialog.Field>
        <div className={styles.youtubePreviewRow}>
          <TrackYoutubeOverridePreview
            key={previewVideoId ?? "empty"}
            videoId={previewVideoId}
          />
          <div className={styles.youtubePreviewMeta}>
            <TrackYoutubeOverrideVideoMeta
              videoId={previewVideoId}
              enabled={open}
            />
          </div>
        </div>
        {youtubeInputError ? (
          <p className={styles.error} role="alert">
            {youtubeInputError}
          </p>
        ) : null}
        {discogsVideosUpdateUrl ? (
          <p className={styles.communityNote}>
            This link is saved on your collection copy only. To share playback
            with the wider Discogs community,{" "}
            <Link
              className={styles.communityNoteLink}
              href={discogsVideosUpdateUrl}
              rel="noopener noreferrer"
              target="_blank"
              onClick={stopLinkPropagation}
            >
              add the video on Discogs
            </Link>
            .
          </p>
        ) : null}
      </form>
    </FormDialog>
  );
};
