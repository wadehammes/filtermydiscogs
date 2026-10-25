import { api } from "src/api/urls";
import { PlaybackProvidersShell } from "src/components/PlaybackProvidersShell.component";
import { LOGIN_DEMO_PUBLIC_PLAYLIST_ID } from "src/constants/publicPlaylist.constants";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import {
  TestProviders,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { PublicPlaylistResponse } from "src/types/playlist.types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import {
  PublicPlaylistClient,
  PublicPlaylistPage,
} from "./PublicPlaylist.component";

jest.mock("src/api/urls", () => ({
  api: {
    discogsRelease: jest.fn(),
    playlist: jest.fn(),
    publicPlaylist: jest.fn(),
  },
}));

export const mockPublicPlaylistApi = jest.mocked(api.publicPlaylist);
export const mockPrivatePlaylistApi = jest.mocked(api.playlist);
const mockDiscogsReleaseApi = jest.mocked(api.discogsRelease);

const mockUsePathname = jest.fn(
  () => `/playlist/${LOGIN_DEMO_PUBLIC_PLAYLIST_ID}`,
);

jest.mock("next/navigation", () => ({
  ...jest.requireActual<typeof import("next/navigation")>("next/navigation"),
  usePathname: () => mockUsePathname(),
  useRouter: () => createMockAppRouter(),
  useSearchParams: () => new URLSearchParams(),
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

export class PublicPlaylistPageObject extends BasePageObject {
  public testId = "fmdPublicPlaylist";
  public playlistId = LOGIN_DEMO_PUBLIC_PLAYLIST_ID;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  setupPublicPlaylistApiMocks(): void {
    mockDiscogsReleaseApi.mockImplementation((releaseId: string) =>
      Promise.resolve(
        discogsReleaseJsonFactory.withTracklistAndVideos({
          id: Number(releaseId),
        }),
      ),
    );
  }

  mockPublicPlaylistResponse(payload: PublicPlaylistResponse): void {
    this.setupPublicPlaylistApiMocks();
    mockPublicPlaylistApi.mockResolvedValueOnce(payload);
  }

  renderPublicPlaylistClientWithPlaybackShell(options?: {
    initialPublicPlaylist?: PublicPlaylistResponse;
  }): RenderResult {
    return render(
      <PlaybackProvidersShell>
        <PublicPlaylistClient
          playlistId={this.playlistId}
          {...(options?.initialPublicPlaylist !== undefined
            ? { initialPublicPlaylist: options.initialPublicPlaylist }
            : {})}
        />
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

  renderPublicPlaylistPage(): RenderResult {
    return render(<PublicPlaylistPage playlistId={this.playlistId} />, {
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
}
