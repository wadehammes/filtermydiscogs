import type { RenderResult } from "@testing-library/react";
import { PlaylistDrawerProvider } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistDrawerFooter } from "src/components/PlaylistDrawerFooter/PlaylistDrawerFooter.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import { render } from "test-utils";

export class PlaylistDrawerFooterPageObject extends BasePageObject {
  public testId = "fmdPlaylistDrawerFooter";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private playlistDrawerFooterElement() {
    return (
      <ReleasePlaybackTestTree>
        <PlaylistDrawerProvider
          activePlaylistId={null}
          selectPlaylist={() => {}}
        >
          <PlaylistDrawerFooter />
        </PlaylistDrawerProvider>
      </ReleasePlaybackTestTree>
    );
  }

  renderPlaylistDrawerFooter(): RenderResult {
    return render(this.playlistDrawerFooterElement());
  }
}
