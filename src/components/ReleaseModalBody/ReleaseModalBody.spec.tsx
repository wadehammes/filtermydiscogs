import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseModalBodyPageObject } from "src/components/ReleaseModalBody/ReleaseModalBody.po";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { act, screen, waitFor } from "test-utils";

let po: ReleaseModalBodyPageObject;

describe("ReleaseModalBody tracklist loading", () => {
  beforeEach(() => {
    po = new ReleaseModalBodyPageObject();
  });

  it("shows the tracklist skeleton during the first fetch, then the tracklist", async () => {
    const resolveFetch = po.mockPendingDiscogsRelease();

    po.renderReleaseModalBody();

    expect(
      screen.getByTestId("fmdReleaseTracklistSkeleton"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("fmdReleaseTracklist")).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch();
    });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("fmdReleaseTracklistSkeleton"),
    ).not.toBeInTheDocument();
  });

  it("does not leave the tracklist skeleton after reopening with cached detail", async () => {
    const view = po.renderReleaseModalBody({ isOpen: true });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    });

    po.rerenderReleaseModalBody(view, { isOpen: false });
    expect(
      screen.queryByTestId("fmdReleaseTracklistSkeleton"),
    ).not.toBeInTheDocument();

    po.rerenderReleaseModalBody(view, { isOpen: true });

    expect(
      screen.queryByTestId("fmdReleaseTracklistSkeleton"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    expect(po.mockApi.discogsRelease).toHaveBeenCalledTimes(1);
  });

  it("does not show the tracklist skeleton when the modal body is closed", () => {
    po.renderReleaseModalBody({ isOpen: false });

    expect(
      screen.queryByTestId("fmdReleaseTracklistSkeleton"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("fmdReleaseTracklist")).not.toBeInTheDocument();
    expect(po.mockApi.discogsRelease).not.toHaveBeenCalled();
  });

  it("shows the load error state when release detail fetch fails", async () => {
    po.mockDiscogsReleaseFetchError(500, "Server error");

    po.renderReleaseModalBody();

    expect(
      await screen.findByTestId("fmdReleaseModalDetailLoadError"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Could not load track listing for this release."),
    ).toBeInTheDocument();
  });
});

describe("ReleaseModalBody modal notes", () => {
  beforeEach(() => {
    po = new ReleaseModalBodyPageObject();
  });

  it("remounts the notes editor when switching releases so save UI does not stick", async () => {
    const user = userEvent.setup();
    const releaseA = releaseFactory.forNotesEditor(12345, {
      instance_id: "body-notes-a",
      notes: [],
    });
    const releaseB = releaseFactory.forNotesEditor(67890, {
      instance_id: "body-notes-b",
      notes: [{ field_id: 3, value: "Other release note" }],
    });

    po.mockDiscogsReleaseById(
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 12345 }),
      {
        "67890": discogsReleaseJsonFactory.withTracklistAndVideos({
          id: 67890,
          title: "Other Album",
        }),
      },
    );

    const resolveSave = po.mockPendingUpdateCollectionNote();

    const view = po.renderReleaseModalBody({ release: releaseA });

    const notesField = await screen.findByRole("textbox", { name: "Notes" });

    await user.type(notesField, "Draft");
    await user.tab();

    expect(await screen.findByText("Saving…")).toBeInTheDocument();

    po.rerenderReleaseModalBody(view, { release: releaseB });

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Other release note"),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();

    resolveSave(crateMutationSuccessFactory.build());

    expect(screen.queryByText("Saving…")).not.toBeInTheDocument();
  });
});
