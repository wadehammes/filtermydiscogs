import type { ReactElement } from "react";
import { api } from "src/api/urls";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import {
  crateDrawerPartiallyPackedResponse,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateDrawerReleases } from "src/components/CrateDrawerReleases/CrateDrawerReleases.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import type { RenderResult } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

export class CrateDrawerReleasesPageObject extends BasePageObject {
  public testId = "fmdCrateDrawerReleases";
  public mockApi = mockApi;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    setupCrateDrawerTests(this.mockApi);
  }

  mockCrateResolved(value: Awaited<ReturnType<typeof mockApi.crate>>): void {
    this.mockApi.crate.mockResolvedValue(value);
  }

  mockClearAllPackedSuccess(): void {
    this.mockApi.clearAllPackedInCrate.mockResolvedValue(
      crateMutationSuccessFactory.clearPacked(1),
    );
  }

  mockReleaseOpenPrefetch(releaseId = 249504): void {
    setupFetchDiscogsReleaseMock(
      this.mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: releaseId }),
    );
  }

  mockPartiallyPackedCrate(): void {
    this.mockCrateResolved(crateDrawerPartiallyPackedResponse);
  }

  renderCrateDrawerReleases(
    options: Parameters<typeof renderCrateDrawerTree>[1] = {},
    ui: ReactElement = <CrateDrawerReleases />,
  ): RenderResult {
    return renderCrateDrawerTree(ui, options);
  }
}
