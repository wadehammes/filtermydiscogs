import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseNotesPageObject } from "src/components/ReleaseNotes/ReleaseNotes.po";
import {
  RELEASE_NOTES_SAVE_TOAST_ID,
  RELEASE_NOTES_SAVED_TOAST_DURATION_MS,
} from "src/components/ReleaseNotes/releaseNotesSaveToast";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor } from "test-utils";

let po: ReleaseNotesPageObject;

describe("ReleaseNotes", () => {
  beforeEach(() => {
    po = new ReleaseNotesPageObject();
    po.mockToastDismiss.mockClear();
    po.mockToastLoading.mockClear();
    po.mockToastSuccess.mockClear();
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

  it("keeps modal note fields editable while a save is in flight", async () => {
    const user = userEvent.setup();
    let resolveSave: ((value: { success: boolean }) => void) | undefined;

    po.mockApi.updateCollectionNote.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );

    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
    });

    const notesField = await screen.findByRole("textbox", { name: "Notes" });

    await user.type(notesField, "Signed");
    await user.tab();

    expect(await screen.findByText("Saving…")).toBeInTheDocument();
    expect(po.mockToastLoading).not.toHaveBeenCalled();

    expect(notesField).not.toBeDisabled();
    await user.click(notesField);
    expect(notesField).toHaveFocus();

    resolveSave?.(crateMutationSuccessFactory.build());

    await waitFor(() => {
      expect(po.mockToastSuccess).toHaveBeenCalled();
    });
  });

  it("autosaves modal notes after debounce when the field stays focused", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    po.mockApi.updateCollectionNote.mockResolvedValue(
      crateMutationSuccessFactory.build(),
    );

    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
    });

    const notesField = await screen.findByRole("textbox", { name: "Notes" });

    await user.type(notesField, "Signed");

    expect(po.mockApi.updateCollectionNote).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(700);

    await waitFor(() => {
      expect(po.mockApi.updateCollectionNote).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it("does not show a second saved toast when blurring after save", async () => {
    const user = userEvent.setup();

    po.mockApi.updateCollectionNote.mockResolvedValue(
      crateMutationSuccessFactory.build(),
    );

    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
    });

    const notesField = await screen.findByRole("textbox", { name: "Notes" });

    await user.type(notesField, "Signed");
    await user.click(document.body);

    await waitFor(() => {
      expect(po.mockToastSuccess).toHaveBeenCalledTimes(1);
    });

    po.mockToastSuccess.mockClear();

    await user.click(document.body);

    expect(po.mockToastSuccess).not.toHaveBeenCalled();
  });

  it("shows inline saving and saved status beside the modal notes character count", async () => {
    const user = userEvent.setup();
    let resolveSave: ((value: { success: boolean }) => void) | undefined;

    po.mockApi.updateCollectionNote.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );

    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
    });

    const notesField = await screen.findByRole("textbox", { name: "Notes" });

    await user.type(notesField, "Signed");
    await user.tab();

    const charCount = await screen.findByText("6 / 10000");

    expect(await screen.findByText("Saving…")).toBeInTheDocument();

    resolveSave?.(crateMutationSuccessFactory.build());

    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
    expect(charCount).toBeInTheDocument();
  });

  it("shows loading and success toasts when modal notes or condition fields are saved", async () => {
    const user = userEvent.setup();

    po.mockApi.updateCollectionNote.mockResolvedValue(
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
      expect(po.mockToastLoading).toHaveBeenCalledWith("Saving…", {
        duration: Number.POSITIVE_INFINITY,
        id: RELEASE_NOTES_SAVE_TOAST_ID,
      });
      expect(po.mockToastSuccess).toHaveBeenCalledWith("Saved", {
        duration: RELEASE_NOTES_SAVED_TOAST_DURATION_MS,
        id: RELEASE_NOTES_SAVE_TOAST_ID,
      });
    });
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });

  it("saves notes without triggering another collection fetch", async () => {
    const user = userEvent.setup();

    po.mockApi.discogsCollection.mockImplementation(
      () => new Promise(() => {}),
    );
    po.mockApi.updateCollectionNote.mockResolvedValue(
      crateMutationSuccessFactory.build(),
    );

    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
      includeCollectionSync: true,
    });

    await waitFor(() => {
      expect(po.mockApi.discogsCollection).toHaveBeenCalled();
    });

    const collectionFetchCount = po.mockApi.discogsCollection.mock.calls.length;

    const notesField = await screen.findByRole("textbox", { name: "Notes" });

    await user.type(notesField, "Signed copy");
    await user.tab();

    await waitFor(() => {
      expect(po.mockApi.updateCollectionNote).toHaveBeenCalled();
    });

    expect(po.mockApi.discogsCollection.mock.calls.length).toBe(
      collectionFetchCount,
    );
  });

  it("completes note save while the collection fetch is still in flight", async () => {
    const user = userEvent.setup();

    po.mockApi.discogsCollection.mockImplementation(
      () => new Promise(() => {}),
    );
    po.mockApi.updateCollectionNote.mockResolvedValue(
      crateMutationSuccessFactory.build(),
    );

    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
      includeCollectionSync: true,
    });

    await waitFor(() => {
      expect(po.mockApi.discogsCollection).toHaveBeenCalled();
    });

    const notesField = await screen.findByRole("textbox", { name: "Notes" });

    await user.type(notesField, "Signed copy");
    await user.tab();

    await waitFor(() => {
      expect(po.mockApi.updateCollectionNote).toHaveBeenCalled();
      expect(po.mockToastSuccess).toHaveBeenCalled();
    });
  });

  it("clears in-flight save UI when switching to a different release in the modal", async () => {
    const user = userEvent.setup();
    let resolveSave: ((value: { success: boolean }) => void) | undefined;

    po.mockApi.updateCollectionNote.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );

    const releaseA = releaseFactory.forNotesEditor(12345, {
      instance_id: "modal-notes-a",
      notes: [],
    });
    const releaseB = releaseFactory.forNotesEditor(67890, {
      instance_id: "modal-notes-b",
      notes: [{ field_id: 3, value: "Existing note" }],
    });

    const view = po.renderReleaseNotes({
      release: releaseA,
      variant: "modal",
    });

    const notesField = await screen.findByRole("textbox", { name: "Notes" });

    await user.type(notesField, "Signed");
    await user.tab();

    expect(await screen.findByText("Saving…")).toBeInTheDocument();

    po.rerenderReleaseNotes(view, { release: releaseB, variant: "modal" });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing note")).toBeInTheDocument();
    });
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();

    resolveSave?.(crateMutationSuccessFactory.build());

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
