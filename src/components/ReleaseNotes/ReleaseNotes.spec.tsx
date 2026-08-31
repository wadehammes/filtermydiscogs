import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { ReleaseNotesPageObject } from "src/components/ReleaseNotes/ReleaseNotes.po";
import {
  RELEASE_NOTES_SAVE_TOAST_ID,
  RELEASE_NOTES_SAVED_TOAST_DURATION_MS,
} from "src/components/ReleaseNotes/releaseNotesSaveToast";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { toast } from "src/utils/toast";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/utils/toast", () => ({
  toast: {
    dismiss: jest.fn(),
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockApi = jest.mocked(api);
const mockToastDismiss = jest.mocked(toast.dismiss);
const mockToastLoading = jest.mocked(toast.loading);
const mockToastSuccess = jest.mocked(toast.success);

let po: ReleaseNotesPageObject;

describe("ReleaseNotes", () => {
  beforeEach(() => {
    po = new ReleaseNotesPageObject();
    mockToastDismiss.mockClear();
    mockToastLoading.mockClear();
    mockToastSuccess.mockClear();
  });

  it("renders card notes section on every release card", async () => {
    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "displayOnly",
    });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add notes" }),
      ).toBeInTheDocument();
    });
  });

  it("renders card note text when notes are present", () => {
    const release = releaseFactory.withNotes([
      { field_id: 3, value: "Signed copy" },
    ]);

    po.renderReleaseNotes({ release, variant: "displayOnly" });

    expect(
      screen.getByRole("heading", { level: 4, name: "Notes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Signed copy")).toBeInTheDocument();
  });

  it("renders inline note labels and values", async () => {
    const release = releaseFactory.withNotes([
      { field_id: 3, value: "Near mint" },
    ]);

    po.renderReleaseNotes({ release, variant: "inline" });

    await waitFor(() => {
      expect(screen.getByText("Notes")).toBeInTheDocument();
    });
    expect(screen.getByText("Near mint")).toBeInTheDocument();
  });

  it("renders modal notes with inline editor fields", async () => {
    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
    });

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: "Notes" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Media Condition")).toBeInTheDocument();
    expect(screen.getByLabelText("Sleeve Condition")).toBeInTheDocument();
  });

  it("renders modal note text in the inline editor when notes are present", async () => {
    const release = releaseFactory.withNotes([
      { field_id: 3, value: "Signed copy" },
    ]);

    po.renderReleaseNotes({ release, variant: "modal" });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Signed copy")).toBeInTheDocument();
    });
  });

  it("shows loading and success toasts when modal notes or condition fields are saved", async () => {
    const user = userEvent.setup();

    mockApi.updateCollectionNote.mockResolvedValue(
      crateMutationSuccessFactory.build(),
    );

    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Media Condition")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Media Condition"));
    await user.click(
      await screen.findByRole("option", { name: "Very Good Plus (VG+)" }),
    );

    await waitFor(() => {
      expect(mockToastLoading).toHaveBeenCalledWith("Saving…", {
        duration: Number.POSITIVE_INFINITY,
        id: RELEASE_NOTES_SAVE_TOAST_ID,
      });
      expect(mockToastSuccess).toHaveBeenCalledWith("Saved", {
        duration: RELEASE_NOTES_SAVED_TOAST_DURATION_MS,
        id: RELEASE_NOTES_SAVE_TOAST_ID,
      });
    });
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("renders nothing for inline variant when there are no notes and editing is unavailable", () => {
    po.renderReleaseNotes({
      release: releaseFactory.withEmptyNotes(),
      variant: "inline",
      authenticated: false,
    });

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
  });
});
