import { beforeEach, describe, expect, it } from "@jest/globals";
import bottomDrawerStyles from "src/components/BottomDrawer/BottomDrawer.module.css";
import { PlaybackQueueDrawer } from "src/components/PlaybackQueueDrawer/PlaybackQueueDrawer.component";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { render, screen } from "test-utils";

describe("PlaybackQueueDrawer", () => {
  beforeEach(() => {
    setupMockMatchMedia({ desktop: true });
  });

  it("right-aligns the inline drawer shell on desktop", () => {
    render(
      <ReleasePlaybackProvider>
        <PlaybackQueueDrawer isOpen onClose={() => {}} />
      </ReleasePlaybackProvider>,
    );

    const shell = screen.getByTestId("fmdBottomDrawer");

    expect(shell.className).toContain(bottomDrawerStyles.inlineAlignEnd);
  });
});
