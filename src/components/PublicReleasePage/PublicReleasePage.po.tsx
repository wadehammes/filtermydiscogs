jest.mock("src/api/urls", () => ({
  api: {
    discogsRelease: jest.fn(),
  },
}));

import { ApiFetchError } from "src/api/apiFetchError";
import { api } from "src/api/urls";
import { PlaybackProvidersShell } from "src/components/PlaybackProvidersShell.component";
import {
  PublicReleaseClient,
  PublicReleasePage,
} from "src/components/PublicReleasePage/PublicReleasePage.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import {
  TestProviders,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

const mockDiscogsReleaseApi = jest.mocked(api.discogsRelease);

jest.mock(
  "src/components/PublicReleaseModal/PublicReleaseModal.component",
  () => ({
    PublicReleaseModal: () => null,
  }),
);

jest.mock(
  "src/components/LoginConnectButton/LoginConnectButton.component",
  () => ({
    LoginConnectButton: () => null,
  }),
);

jest.mock("next/navigation", () => ({
  ...jest.requireActual<typeof import("next/navigation")>("next/navigation"),
  useRouter: () => createMockAppRouter(),
  usePathname: () => "/release/249504",
  useSearchParams: () => new URLSearchParams(),
}));

export class PublicReleasePageObject extends BasePageObject {
  public testId = "fmdPublicReleasePage";
  public releaseId = "249504";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  setupDiscogsReleaseApiMock(): void {
    mockApiResponse(
      true,
      mockDiscogsReleaseApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({
        id: Number(this.releaseId),
      }),
      new Error("Discogs release request failed"),
    );
  }

  mockDiscogsReleaseNotFound(): void {
    mockApiResponse(
      false,
      mockDiscogsReleaseApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({}),
      new ApiFetchError(404),
    );
  }

  renderPublicReleasePage(
    overrides: { releaseId?: string } = {},
  ): RenderResult {
    const releaseId = overrides.releaseId ?? this.releaseId;
    this.setupDiscogsReleaseApiMock();

    return render(<PublicReleasePage releaseId={releaseId} />, {
      wrapper: ({ children }) => (
        <TestProviders
          authInitialState={testUnauthenticatedAuthState}
          includeCollectionSync={false}
        >
          {children}
        </TestProviders>
      ),
    });
  }

  renderPublicReleaseClient(
    overrides: { releaseId?: string; setupDiscogsReleaseApi?: boolean } = {},
  ): RenderResult {
    const { setupDiscogsReleaseApi = true, ...rest } = overrides;
    const releaseId = rest.releaseId ?? this.releaseId;

    if (setupDiscogsReleaseApi) {
      this.setupDiscogsReleaseApiMock();
    }

    return render(
      <TestProviders
        authInitialState={testUnauthenticatedAuthState}
        includeCollectionSync={false}
      >
        <PlaybackProvidersShell>
          <PublicReleaseClient releaseId={releaseId} />
        </PlaybackProvidersShell>
      </TestProviders>,
    );
  }
}

export { mockDiscogsReleaseApi };
