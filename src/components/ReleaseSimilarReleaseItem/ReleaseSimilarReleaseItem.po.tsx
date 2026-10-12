import { ReleaseSimilarReleaseItem } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.component";
import type { BasePageObjectProps } from "src/tests/BasePageObject.po";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { ReleaseOpenPrefetchPageObject } from "src/tests/ReleaseOpenPrefetchPageObject.po";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");

const apiError = new Error("API request failed");

export type ReleaseSimilarReleaseItemRenderProps = {
  release?: DiscogsRelease;
  onReleaseClick?: (instanceId: string) => void;
};

export class ReleaseSimilarReleaseItemPageObject extends ReleaseOpenPrefetchPageObject {
  public testId = "fmdReleaseSimilarItem";
  public defaultCrate = crateFactory.defaultTestCrate();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    mockApiResponse(
      true,
      this.mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      apiError,
    );
  }

  mockCrateContainsRelease(release: DiscogsRelease): void {
    mockApiResponse(
      true,
      this.mockApi.crate,
      crateWithReleasesResponseFactory.withReleases(this.defaultCrate, [
        release,
      ]),
      apiError,
    );
  }

  private releaseSimilarReleaseItemElement(
    overrides: ReleaseSimilarReleaseItemRenderProps = {},
  ) {
    const {
      release = releaseFactory.withTitle("Similar Album", 249504, {
        instance_id: "similar-instance",
      }),
      onReleaseClick,
    } = overrides;

    return (
      <ReleaseSimilarReleaseItem
        release={release}
        {...(onReleaseClick ? { onReleaseClick } : {})}
      />
    );
  }

  renderReleaseSimilarReleaseItem(
    overrides: ReleaseSimilarReleaseItemRenderProps = {},
  ): RenderResult {
    return render(this.releaseSimilarReleaseItemElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
