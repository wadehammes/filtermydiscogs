import type { RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { api } from "src/api/urls";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import {
  ReleaseTrackRowMenu,
  type ReleaseTrackRowMenuProps,
} from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenu.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render } from "test-utils";

jest.mock("src/api/urls");

export type ReleaseTrackRowMenuRenderProps =
  Partial<ReleaseTrackRowMenuProps> & {
    omitOnAddToQueue?: boolean;
  };

const defaultProps = {
  trackTitle: "Test track",
  canAddToQueue: true,
  canUnqueue: false,
  isQueued: false,
  hasUserYoutubeOverride: false,
  hasDefaultYoutubeEmbed: false,
  onAddToQueue: () => undefined,
  releaseHasQueueActions: true,
  useMenuOverlayStack: false,
} satisfies ReleaseTrackRowMenuProps;

const mockApi = jest.mocked(api);
const playlistsApiError = new Error("Playlists API request failed");

export class ReleaseTrackRowMenuPageObject extends BasePageObject {
  public testId = "fmdReleaseTrackRowMenu";
  public menuPanelTestId = "fmdReleaseTrackRowMenuPanel";
  public menuTriggerTestId = "fmdReleaseTrackRowMenuTrigger";
  public playlistPickerSubmenuTestId = "fmdReleasePlaylistPickerMenu";
  public createPlaylistDialogTestId = "fmdCreatePlaylistDialog";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    mockApiResponse(true, mockApi.playlists, [], playlistsApiError);
  }

  private releaseTrackRowMenuElement(
    overrides: ReleaseTrackRowMenuRenderProps = {},
  ): ReactElement {
    const { omitOnAddToQueue, ...rest } = overrides;
    let props: ReleaseTrackRowMenuProps = { ...defaultProps, ...rest };
    if (omitOnAddToQueue) {
      const { onAddToQueue: _removed, ...withoutAdd } = props;
      props = withoutAdd;
    }

    return (
      <OverlayStack>
        <ReleaseTrackRowMenu {...props} />
      </OverlayStack>
    );
  }

  renderReleaseTrackRowMenu(
    overrides: ReleaseTrackRowMenuRenderProps = {},
  ): RenderResult {
    const usesPlaylistPicker = overrides.playlistPickerMetadata !== undefined;

    if (usesPlaylistPicker) {
      return render(this.releaseTrackRowMenuElement(overrides), {
        authInitialState: testAuthenticatedAuthState,
        includeCollectionSync: false,
      });
    }

    return render(this.releaseTrackRowMenuElement(overrides));
  }

  rerenderReleaseTrackRowMenu(
    rerender: RenderResult["rerender"],
    overrides: ReleaseTrackRowMenuRenderProps = {},
  ): void {
    rerender(this.releaseTrackRowMenuElement(overrides));
  }
}
