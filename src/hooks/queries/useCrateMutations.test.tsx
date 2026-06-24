import { beforeEach, describe, expect, it } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import * as apiHelpers from "src/api/helpers";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { createCrateResponseFactory } from "src/tests/factories/CreateCrateResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type {
  CratesResponse,
  CrateWithReleasesResponse,
} from "src/types/crate.types";
import { act, renderHook, waitFor } from "test-utils";
import { CrateQueryKeys, CratesQueryKeys } from "./querykeys.constants";
import { useUpdateCrateMutation } from "./useCrateMutations";

jest.mock("src/api/helpers");

const mockUpdateCrate = jest.mocked(apiHelpers.updateCrate);
const mockFetchCrates = jest.mocked(apiHelpers.fetchCrates);
const mockFetchCrate = jest.mocked(apiHelpers.fetchCrate);

const userId = "123";
const newCrateId = "crate-new";
const oldDefaultCrateId = "crate-old";

const defaultCratesResponse: CratesResponse = cratesResponseFactory.withCrates([
  crateWithCountFactory.build({
    id: oldDefaultCrateId,
    is_default: true,
    releaseCount: 0,
  }),
  crateWithCountFactory.build({
    id: newCrateId,
    is_default: false,
    releaseCount: 1,
  }),
]);

describe("useUpdateCrateMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockApiResponse(
      true,
      mockFetchCrates,
      defaultCratesResponse,
      new Error("Failed to fetch crates"),
    );

    mockFetchCrate.mockImplementation(async (crateId: string) => {
      const crateSummary = defaultCratesResponse.crates.find(
        (crate) => crate.id === crateId,
      );

      if (!crateSummary) {
        throw new Error(`Crate not found: ${crateId}`);
      }

      const { releaseCount: _releaseCount, ...crateWithoutCount } =
        crateSummary;

      return crateWithReleasesResponseFactory.empty(crateWithoutCount);
    });
  });

  it("preserves cached releases when making a crate default", async () => {
    const release = releaseFactory.build({ instance_id: "999" });
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const cratesResponse: CratesResponse = cratesResponseFactory.withCrates([
      crateWithCountFactory.build({
        id: oldDefaultCrateId,
        is_default: true,
        releaseCount: 0,
      }),
      crateWithCountFactory.build({
        id: newCrateId,
        is_default: false,
        releaseCount: 1,
      }),
    ]);

    const crateDetail: CrateWithReleasesResponse =
      crateWithReleasesResponseFactory.withReleases(
        crateFactory.build({ id: newCrateId, is_default: false }),
        [release],
      );

    queryClient.setQueryData(CratesQueryKeys.byUserId(userId), cratesResponse);
    queryClient.setQueryData(
      CrateQueryKeys.byUserAndId(userId, newCrateId),
      crateDetail,
    );

    mockUpdateCrate.mockResolvedValue(
      createCrateResponseFactory.forCrate(
        crateFactory.build({ id: newCrateId, is_default: true }),
      ),
    );

    const { result } = renderHook(() => useUpdateCrateMutation(userId), {
      wrapper: ({ children }) => (
        <TestProviders
          queryClient={queryClient}
          authInitialState={testAuthenticatedAuthState}
        >
          {children}
        </TestProviders>
      ),
    });

    await act(async () => {
      await result.current.mutateAsync({
        crateId: newCrateId,
        updates: { is_default: true },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const updatedCrateDetail =
      queryClient.getQueryData<CrateWithReleasesResponse>(
        CrateQueryKeys.byUserAndId(userId, newCrateId),
      );

    expect(updatedCrateDetail?.releases).toHaveLength(1);
    expect(updatedCrateDetail?.releases[0]?.instance_id).toBe("999");
    expect(updatedCrateDetail?.crate.is_default).toBe(true);
  });
});
