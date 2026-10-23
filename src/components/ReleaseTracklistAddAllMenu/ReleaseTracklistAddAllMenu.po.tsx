import type { RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { api } from "src/api/urls";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import {
  ReleaseTracklistAddAllMenu,
  type ReleaseTracklistAddAllMenuProps,
} from "src/components/ReleaseTracklistAddAllMenu/ReleaseTracklistAddAllMenu.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render } from "test-utils";

jest.mock("src/api/urls");

const playlistsApiError = new Error("Playlists API request failed");

export type ReleaseTracklistAddAllMenuRenderProps =
  Partial<ReleaseTracklistAddAllMenuProps>;

const defaultProps: ReleaseTracklistAddAllMenuProps = {
  onAddAllToQueue: () => {},
  trackMetadataList: [],
  releaseTitle: "Test release",
  showPlaylistSubmenu: false,
};

export class ReleaseTracklistAddAllMenuPageObject extends BasePageObject {
  public testId = "fmdReleaseTracklistAddAllMenu";
  public triggerTestId = "fmdReleaseTracklistAddAllButton";
  public panelTestId = "fmdReleaseTracklistAddAllMenuPanel";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    mockApiResponse(true, jest.mocked(api).playlists, [], playlistsApiError);
  }

  private releaseTracklistAddAllMenuElement(
    overrides: ReleaseTracklistAddAllMenuRenderProps = {},
  ): ReactElement {
    return (
      <OverlayStack>
        <ReleaseTracklistAddAllMenu {...defaultProps} {...overrides} />
      </OverlayStack>
    );
  }

  renderReleaseTracklistAddAllMenu(
    overrides: ReleaseTracklistAddAllMenuRenderProps = {},
  ): RenderResult {
    const usesPlaylistSubmenu =
      overrides.showPlaylistSubmenu ?? defaultProps.showPlaylistSubmenu;

    if (usesPlaylistSubmenu) {
      return render(this.releaseTracklistAddAllMenuElement(overrides), {
        authInitialState: testAuthenticatedAuthState,
      });
    }

    return render(this.releaseTracklistAddAllMenuElement(overrides));
  }
}
