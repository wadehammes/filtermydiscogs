import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseNotesCardActionPageObject } from "src/components/ReleaseNotes/ReleaseNotesCardAction.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor } from "test-utils";

let po: ReleaseNotesCardActionPageObject;

describe("ReleaseNotesCardAction", () => {
  beforeEach(() => {
    po = new ReleaseNotesCardActionPageObject();
  });

  it("does not show a notes indicator when the release has no notes", async () => {
    po.renderReleaseNotesCardAction();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add release notes" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("fmdReleaseNotesIndicator"),
    ).not.toBeInTheDocument();
  });

  it("shows a notes indicator when the release has notes", async () => {
    const release = releaseFactory.withNotes([
      { field_id: 3, value: "Signed copy" },
    ]);

    po.renderReleaseNotesCardAction(release);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Edit release notes" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("fmdReleaseNotesIndicator")).toBeInTheDocument();
  });

  it("opens the note edit dialog when clicked", async () => {
    const user = userEvent.setup();

    po.renderReleaseNotesCardAction();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add release notes" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Add release notes" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdNoteEditDialog")).toBeInTheDocument();
    });
  });
});
