import type { RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { api } from "src/api/urls";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import {
  ReleaseMiniPlayerAddToMenuView,
  type ReleaseMiniPlayerAddToMenuViewProps,
} from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerAddToMenuView.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render } from "test-utils";

jest.mock("src/api/urls");

export type ReleaseMiniPlayerAddToMenuViewRenderProps =
  Partial<ReleaseMiniPlayerAddToMenuViewProps>;

const defaultRelease = releaseFactory.withDisplayDefaults();

const defaultProps = {
  release: defaultRelease,
  actionClass: () => "action-class",
  submenuOpenOnHover: false,
} satisfies ReleaseMiniPlayerAddToMenuViewProps;

const mockApi = jest.mocked(api);
const crateApiError = new Error("Crate API request failed");

export class ReleaseMiniPlayerAddToMenuViewPageObject extends BasePageObject {
  public menuHostTestId = "fmdReleaseAddToMenuHost";
  public menuTriggerTestId = "fmdReleaseAddToMenuTrigger";
  public menuPanelTestId = "fmdReleaseAddToMenu";
  public addToTriggerLabel = "Add to";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      crateApiError,
    );
  }

  private releaseMiniPlayerAddToMenuViewElement(
    overrides: ReleaseMiniPlayerAddToMenuViewRenderProps = {},
  ): ReactElement {
    return (
      <OverlayStack
        escapeStackingContext
        popoverZIndex="calc(var(--z-9-playback-dock) + 1)"
      >
        <ReleaseMiniPlayerAddToMenuView {...defaultProps} {...overrides} />
      </OverlayStack>
    );
  }

  renderReleaseMiniPlayerAddToMenuView(
    overrides: ReleaseMiniPlayerAddToMenuViewRenderProps = {},
  ): RenderResult {
    return render(this.releaseMiniPlayerAddToMenuViewElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
