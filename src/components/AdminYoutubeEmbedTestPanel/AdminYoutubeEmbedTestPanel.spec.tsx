import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { AdminYoutubeEmbedTestPanelPageObject } from "src/components/AdminYoutubeEmbedTestPanel/AdminYoutubeEmbedTestPanel.po";
import { TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE } from "src/lib/validation/userTrack.schemas";
import { screen, waitFor } from "test-utils";

describe("AdminYoutubeEmbedTestPanel", () => {
  const po = new AdminYoutubeEmbedTestPanelPageObject();

  it("when the video input is invalid, shows an error and does not mount an iframe", async () => {
    const user = userEvent.setup();

    po.renderPanel();

    await user.type(
      screen.getByTestId("fmdAdminYoutubeEmbedTestInput"),
      "not-a-url",
    );
    await user.click(screen.getByRole("button", { name: "Load embed" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        TRACK_YOUTUBE_OVERRIDE_INVALID_INPUT_MESSAGE,
      );
    });
    expect(screen.queryByTestId("fmdAdminYoutubeEmbedTestIframe")).toBeNull();
  });

  it("when a valid video id is submitted, mounts an iframe with the production nocookie embed URL", async () => {
    const user = userEvent.setup();

    po.renderPanel();

    await user.type(
      screen.getByTestId("fmdAdminYoutubeEmbedTestInput"),
      "te2jJncBVG4",
    );
    await user.click(screen.getByRole("button", { name: "Load embed" }));

    const iframe = await screen.findByTestId("fmdAdminYoutubeEmbedTestIframe");

    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/te2jJncBVG4"),
    );
    expect(iframe.getAttribute("src")).toContain("enablejsapi=1");
    expect(screen.getByText(/Active video ID:/)).toBeInTheDocument();
  });
});
