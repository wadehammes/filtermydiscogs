import { beforeEach, describe, expect, it } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as apiHelpers from "src/api/helpers";
import { getUserIdFromCookies } from "src/services/auth.service";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { createCrateResponseFactory } from "src/tests/factories/CreateCrateResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  CratesResponse,
  CrateWithReleasesResponse,
} from "src/types/crate.types";
import { act, renderHook, waitFor } from "test-utils";
import { CrateQueryKeys, CratesQueryKeys } from "./querykeys.constants";
import { useUpdateCrateMutation } from "./useCrateMutations";

jest.mock("src/api/helpers");
jest.mock("src/services/auth.service");

const mockUpdateCrate = jest.mocked(apiHelpers.updateCrate);
const mockGetUserIdFromCookies = jest.mocked(getUserIdFromCookies);

const userId = "123";
const newCrateId = "crate-new";
const oldDefaultCrateId = "crate-old";

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

describe("useUpdateCrateMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserIdFromCookies.mockReturnValue(userId);
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

    const { result } = renderHook(() => useUpdateCrateMutation(), {
      wrapper: createWrapper(queryClient),
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

    const updatedCrates = queryClient.getQueryData<CratesResponse>(
      CratesQueryKeys.byUserId(userId),
    );
    const updatedCrateDetail =
      queryClient.getQueryData<CrateWithReleasesResponse>(
        CrateQueryKeys.byUserAndId(userId, newCrateId),
      );

    expect(
      updatedCrates?.crates.find((c) => c.id === oldDefaultCrateId)?.is_default,
    ).toBe(false);
    expect(
      updatedCrates?.crates.find((c) => c.id === newCrateId)?.is_default,
    ).toBe(true);
    expect(updatedCrateDetail?.releases).toEqual([release]);
    expect(mockUpdateCrate).toHaveBeenCalledWith(newCrateId, {
      is_default: true,
    });
  });
});
