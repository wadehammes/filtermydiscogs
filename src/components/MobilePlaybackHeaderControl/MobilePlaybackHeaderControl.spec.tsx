import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { MobilePlaybackHeaderControlPageObject } from "src/components/MobilePlaybackHeaderControl/MobilePlaybackHeaderControl.po";
import { ReleaseMiniPlayerPageObject } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.po";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { act, screen, waitFor } from "test-utils";

let po: MobilePlaybackHeaderControlPageObject;
let miniPlayerPo: ReleaseMiniPlayerPageObject;

const mockLayoutRect = {
  width: 240,
  height: 24,
  top: 0,
  left: 0,
  right: 240,
  bottom: 24,
  x: 0,
  y: 0,
  toJSON: () => {},
} as DOMRect;

describe("MobilePlaybackHeaderControl", () => {
  beforeEach(() => {
    po = new MobilePlaybackHeaderControlPageObject();
    miniPlayerPo = new ReleaseMiniPlayerPageObject();
    setupMockMatchMedia({ viewportWidthPx: 390 });
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(mockLayoutRect);
  });

  it("when there is no active playback session, does not render", () => {
    po.renderMobilePlaybackHeaderControl();

    expect(screen.queryByTestId(po.testId)).toBeNull();
  });

  it("when playback is active, renders dock toggle; play/pause only when bar is hidden", async () => {
    const user = userEvent.setup();

    po.renderWithActivePlayback(miniPlayerPo);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Start playback" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(miniPlayerPo.mockApi.discogsRelease).toHaveBeenCalled();
    });

    expect(screen.queryByTestId(po.playPauseTestId)).not.toBeInTheDocument();
    const dockToggle = screen.getByTestId(po.dockToggleTestId);
    expect(dockToggle).toHaveAttribute("aria-label", "Hide playback bar");

    await user.click(dockToggle);

    expect(dockToggle).toHaveAttribute("aria-label", "Show playback bar");
    expect(screen.getByTestId(po.playPauseTestId)).toBeInTheDocument();
    expect(screen.getByTestId(po.miniPlayerTestId)).toHaveAttribute(
      "data-playback-dock-bar-collapsed",
      "true",
    );
  });
});
