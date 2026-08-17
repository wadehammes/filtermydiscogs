import { toast } from "sonner";

export const RELEASE_NOTES_SAVE_TOAST_ID = "release-notes-save";

export const RELEASE_NOTES_SAVED_TOAST_DURATION_MS = 2000;

export const showReleaseNotesSavingToast = (): void => {
  toast.loading("Saving…", {
    id: RELEASE_NOTES_SAVE_TOAST_ID,
    duration: Number.POSITIVE_INFINITY,
  });
};

export const showReleaseNotesSavedToast = (): void => {
  toast.success("Saved", {
    id: RELEASE_NOTES_SAVE_TOAST_ID,
    duration: RELEASE_NOTES_SAVED_TOAST_DURATION_MS,
  });
};

export const dismissReleaseNotesSaveToast = (): void => {
  toast.dismiss(RELEASE_NOTES_SAVE_TOAST_ID);
};
