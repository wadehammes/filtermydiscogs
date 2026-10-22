import type { RenderResult } from "@testing-library/react";
import { PlaylistDrawerProvider } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistDrawerTracks } from "src/components/PlaylistDrawerTracks/PlaylistDrawerTracks.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";

jest.mock("src/hooks/usePlaylistPlayback.hook", () => ({
  usePlaylistPlayback: () => ({
    playPlaylistTracks: jest.fn(),
    playPlaylistTrack: jest.fn(),
    syncPlaylistQueueToTrackOrder: jest.fn(),
  }),
}));

export class PlaylistDrawerTracksPageObject extends BasePageObject {
  public testId = "fmdPlaylistDrawerTracks";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private playlistDrawerTracksElement() {
    return (
      <PlaylistDrawerProvider activePlaylistId={null} selectPlaylist={() => {}}>
        <PlaylistDrawerTracks />
      </PlaylistDrawerProvider>
    );
  }

  renderPlaylistDrawerTracks(): RenderResult {
    return render(this.playlistDrawerTracksElement());
  }
}
