import type { RenderResult } from "@testing-library/react";
import { MobilePlaybackHeaderControl } from "src/components/MobilePlaybackHeaderControl/MobilePlaybackHeaderControl.component";
import type { ReleaseMiniPlayerPageObject } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.po";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { TestProviders } from "src/tests/utils/testProviders";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/utils/postYoutubePlayerCommand");

export class MobilePlaybackHeaderControlPageObject extends BasePageObject {
  public testId = "fmdMobilePlaybackHeaderControl";
  public dockToggleTestId = "fmdMobilePlaybackHeaderDockToggle";
  public playPauseTestId = "fmdMobilePlaybackHeaderPlayPause";
  public miniPlayerTestId = "fmdReleaseMiniPlayer";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private MobilePlaybackHeaderControlElement() {
    return <MobilePlaybackHeaderControl />;
  }

  private IdlePlaybackTree() {
    return (
      <TestProviders>
        <ReleasePlaybackProvider>
          {this.MobilePlaybackHeaderControlElement()}
        </ReleasePlaybackProvider>
      </TestProviders>
    );
  }

  private ActivePlaybackTree(miniPlayerPo: ReleaseMiniPlayerPageObject) {
    const PlaybackStarter = miniPlayerPo.PlaybackStarterElement();

    return (
      <>
        <PlaybackStarter />
        {this.MobilePlaybackHeaderControlElement()}
      </>
    );
  }

  renderMobilePlaybackHeaderControl(): RenderResult {
    return render(this.IdlePlaybackTree());
  }

  renderWithActivePlayback(
    miniPlayerPo: ReleaseMiniPlayerPageObject,
  ): RenderResult {
    const PlaybackWrapper = miniPlayerPo.createWrapper();

    return render(this.ActivePlaybackTree(miniPlayerPo), {
      wrapper: ({ children }) => <PlaybackWrapper>{children}</PlaybackWrapper>,
    });
  }
}
