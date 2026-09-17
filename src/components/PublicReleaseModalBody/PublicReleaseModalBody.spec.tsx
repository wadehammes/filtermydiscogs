import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PublicReleaseModalBodyPageObject } from "src/components/PublicReleaseModalBody/PublicReleaseModalBody.po";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { act, screen, waitFor } from "test-utils";

let po: PublicReleaseModalBodyPageObject;

describe("PublicReleaseModalBody tracklist loading", () => {
  beforeEach(() => {
    po = new PublicReleaseModalBodyPageObject();
  });

  it("shows a loading state during the first fetch, then the tracklist", async () => {
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });
    let resolveFetch!: (value: typeof releaseDetail) => void;

    po.mockApi.discogsRelease.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    po.renderPublicReleaseModalBody();

    expect(
      screen.getByLabelText("Loading release details"),
    ).toBeInTheDocument();
    expect(screen.getByText("Loading tracklist…")).toBeInTheDocument();
    expect(screen.queryByTestId("fmdReleaseTracklist")).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch(releaseDetail);
    });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    });
    expect(
      screen.queryByLabelText("Loading release details"),
    ).not.toBeInTheDocument();
  });

  it("does not refetch when reopening with cached release detail", async () => {
    const view = po.renderPublicReleaseModalBody({ isOpen: true });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    });

    po.rerenderPublicReleaseModalBody(view, { isOpen: false });
    expect(
      screen.queryByLabelText("Loading release details"),
    ).not.toBeInTheDocument();

    po.rerenderPublicReleaseModalBody(view, { isOpen: true });

    expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Loading release details"),
    ).not.toBeInTheDocument();
    expect(po.mockApi.discogsRelease).toHaveBeenCalledTimes(1);
  });

  it("does not fetch release detail when the modal body is closed", () => {
    po.renderPublicReleaseModalBody({ isOpen: false });

    expect(
      screen.queryByLabelText("Loading release details"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("fmdReleaseTracklist")).not.toBeInTheDocument();
    expect(po.mockApi.discogsRelease).not.toHaveBeenCalled();
  });
});

describe("PublicReleaseModalBody error state", () => {
  beforeEach(() => {
    po = new PublicReleaseModalBodyPageObject();
  });

  it("shows an error message and retries the release fetch", async () => {
    const user = userEvent.setup();
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });

    let allowSuccess = false;
    po.mockApi.discogsRelease.mockImplementation(async () => {
      if (!allowSuccess) {
        throw new Error("Network error");
      }

      return releaseDetail;
    });

    po.renderPublicReleaseModalBody();

    expect(
      await screen.findByText("Could not load track listing for this release."),
    ).toBeInTheDocument();

    allowSuccess = true;
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    });
    expect(po.mockApi.discogsRelease.mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
  });
});
