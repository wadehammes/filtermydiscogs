import { beforeEach, describe, expect, it } from "@jest/globals";
import { ReleaseNotesPageObject } from "src/components/ReleaseNotes/ReleaseNotes.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor } from "test-utils";

let po: ReleaseNotesPageObject;

describe("ReleaseNotes", () => {
  beforeEach(() => {
    po = new ReleaseNotesPageObject();
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

  it("renders inline note labels and values", () => {
    const release = releaseFactory.withNotes([
      { field_id: 3, value: "Near mint" },
    ]);

    po.renderReleaseNotes({ release, variant: "inline" });

    expect(screen.getByText(/Field 3:/)).toBeInTheDocument();
    expect(screen.getByText("Near mint")).toBeInTheDocument();
  });

  it("renders modal notes with add and edit actions", async () => {
    po.renderReleaseNotes({
      release: releaseFactory.forNotesEditor(12345, { notes: [] }),
      variant: "modal",
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 3, name: "Notes" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Add notes" }),
    ).toBeInTheDocument();
  });

  it("renders modal note text and edit action when notes are present", async () => {
    const release = releaseFactory.withNotes([
      { field_id: 3, value: "Signed copy" },
    ]);

    po.renderReleaseNotes({ release, variant: "modal" });

    expect(screen.getByText("Signed copy")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Edit notes" }),
      ).toBeInTheDocument();
    });
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
