import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { getMockedModule } from "src/tests/mocks/getMockedExport";

jest.mock("src/services/discogs-oauth.service", () => ({
  discogsOAuthService: {
    makeAuthenticatedRequest: jest.fn(),
    makeConsumerRequest: jest.fn(),
  },
}));

type MockDiscogsOAuthService = {
  makeAuthenticatedRequest: jest.MockedFunction<
    (
      url: string,
      method?: string,
      oauthToken?: string,
      oauthTokenSecret?: string,
    ) => Promise<unknown>
  >;
  makeConsumerRequest: jest.MockedFunction<
    (url: string, method?: string) => Promise<unknown>
  >;
};

const mockDiscogsOAuthService = getMockedModule<{
  discogsOAuthService: MockDiscogsOAuthService;
}>("src/services/discogs-oauth.service").discogsOAuthService;

const RELEASE_URL = "https://api.discogs.com/releases/7564990";
const TOKENS = { accessToken: "access", accessTokenSecret: "secret" };

describe("fetchDiscogsReleaseRecord", () => {
  let fetchDiscogsReleaseRecord: typeof import("src/lib/fetchDiscogsReleaseRecord.server").fetchDiscogsReleaseRecord;

  beforeAll(async () => {
    ({ fetchDiscogsReleaseRecord } = await import(
      "src/lib/fetchDiscogsReleaseRecord.server"
    ));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when authenticated Discogs returns 404, falls back to consumer credentials", async () => {
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 7564990,
    });
    const notFoundError = new Error(
      "That release does not exist or may have been deleted.",
    ) as Error & { status: number };
    notFoundError.status = 404;
    mockDiscogsOAuthService.makeAuthenticatedRequest.mockRejectedValue(
      notFoundError,
    );
    mockDiscogsOAuthService.makeConsumerRequest.mockResolvedValue(
      releaseDetail,
    );

    await expect(
      fetchDiscogsReleaseRecord({
        releaseUrl: RELEASE_URL,
        useAuthenticatedSession: true,
        ...TOKENS,
      }),
    ).resolves.toEqual(releaseDetail);

    expect(mockDiscogsOAuthService.makeConsumerRequest).toHaveBeenCalledWith(
      RELEASE_URL,
      "GET",
    );
  });

  it("when authenticated Discogs returns 404 and consumer also fails, rethrows consumer error", async () => {
    const notFoundError = new Error(
      "That release does not exist or may have been deleted.",
    ) as Error & { status: number };
    notFoundError.status = 404;
    mockDiscogsOAuthService.makeAuthenticatedRequest.mockRejectedValue(
      notFoundError,
    );
    mockDiscogsOAuthService.makeConsumerRequest.mockRejectedValue(
      notFoundError,
    );

    await expect(
      fetchDiscogsReleaseRecord({
        releaseUrl: RELEASE_URL,
        useAuthenticatedSession: true,
        ...TOKENS,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("uses consumer credentials when the session is not authenticated", async () => {
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 7564990,
    });
    mockDiscogsOAuthService.makeConsumerRequest.mockResolvedValue(
      releaseDetail,
    );

    await expect(
      fetchDiscogsReleaseRecord({
        releaseUrl: RELEASE_URL,
        useAuthenticatedSession: false,
      }),
    ).resolves.toEqual(releaseDetail);

    expect(
      mockDiscogsOAuthService.makeAuthenticatedRequest,
    ).not.toHaveBeenCalled();
  });
});
