import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseModalPageObject } from "src/components/ReleaseModal/ReleaseModal.po";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { act, fireEvent, screen, waitFor } from "test-utils";

let po: ReleaseModalPageObject;

describe("ReleaseModal", () => {
  beforeEach(() => {
    po = new ReleaseModalPageObject();
  });

  it("renders nothing when closed", () => {
    po.renderReleaseModal({ isOpen: false });

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
  });

  it("renders the dialog with release details when open", async () => {
    po.renderReleaseModal();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Never Gonna Give You Up" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Never Gonna Give You Up (Instrumental)"),
    ).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = jest.fn();

    po.renderReleaseModal({ onClose });

    fireEvent.keyDown(screen.getByTestId(po.testId), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    po.renderReleaseModal({ onClose });

    const backdrop = screen.getByTestId(`${po.testId}-backdrop`);
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("tracklist loading", () => {
    it("shows the tracklist skeleton during the first fetch, then the tracklist", async () => {
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

      po.renderReleaseModal();

      expect(
        screen.getByTestId("fmdReleaseTracklistSkeleton"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("fmdReleaseTracklist"),
      ).not.toBeInTheDocument();

      await act(async () => {
        resolveFetch(releaseDetail);
      });

      await waitFor(() => {
        expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
      });
      expect(
        screen.queryByTestId("fmdReleaseTracklistSkeleton"),
      ).not.toBeInTheDocument();
    });

    it("does not leave the tracklist skeleton after closing and reopening the modal", async () => {
      const view = po.renderReleaseModal({ isOpen: true });

      await waitFor(() => {
        expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
      });

      po.rerenderReleaseModal(view, { isOpen: false });
      po.rerenderReleaseModal(view, { isOpen: true });

      expect(
        screen.queryByTestId("fmdReleaseTracklistSkeleton"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("fmdReleaseTracklist")).toBeInTheDocument();
      expect(po.mockApi.discogsRelease).toHaveBeenCalledTimes(1);
    });
  });
});
