import { PlaybackProvidersShell } from "src/components/PlaybackProvidersShell.component";
import { PublicCrateClient } from "src/components/PublicCrate/PublicCrateClient.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import {
  TestProviders,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { PaginationInfo } from "src/types/crate.types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

const mockUsePathname = jest.fn(
  () => "/crate/ab65c378-fab9-42c0-96bb-c308d413cbbb",
);

jest.mock("next/navigation", () => ({
  ...jest.requireActual<typeof import("next/navigation")>("next/navigation"),
  usePathname: () => mockUsePathname(),
  useRouter: () => createMockAppRouter(),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("src/components/ReleaseCardGrid/ReleaseCardGrid.component", () => ({
  ReleaseCardGrid: () => <div data-testid="fmdReleaseCardGridMock" />,
}));

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

export const buildPublicCratePagination = (total: number): PaginationInfo => ({
  page: 1,
  pageSize: total,
  total,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

export class PublicCratePageObject extends BasePageObject {
  readonly testId = "fmdPublicCrate";
  readonly crateId = "ab65c378-fab9-42c0-96bb-c308d413cbbb";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  setPathname(pathname: string): void {
    mockUsePathname.mockReturnValue(pathname);
  }

  renderPublicCrate(crateId = this.crateId): RenderResult {
    return render(
      <PlaybackProvidersShell>
        <PublicCrateClient crateId={crateId} />
      </PlaybackProvidersShell>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testUnauthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );
  }
}
