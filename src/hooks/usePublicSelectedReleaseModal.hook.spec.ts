import { beforeEach, describe, expect, it } from "@jest/globals";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "src/api/urls";
import { usePublicSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { act, renderHookWithTestProviders } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const mockUseRouter = jest.mocked(useRouter);
const mockUsePathname = jest.mocked(usePathname);
const mockUseSearchParams = jest.mocked(useSearchParams);

const applyUrl = (url: string) => {
  const queryIndex = url.indexOf("?");

  mockUseSearchParams.mockReturnValue(
    (queryIndex >= 0
      ? new URLSearchParams(url.slice(queryIndex + 1))
      : new URLSearchParams()) as ReturnType<typeof useSearchParams>,
  );
};

describe("usePublicSelectedReleaseModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
    );
    mockUsePathname.mockReturnValue("/crate/demo-crate-id");
    applyUrl("/crate/demo-crate-id");
  });

  it("resolves the selected release from public crate fallback data only", () => {
    const releases = releaseFactory.buildList(1);
    const mockPush = jest.fn();
    const mockRouter = createMockAppRouter({ push: mockPush });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result } = renderHookWithTestProviders(() =>
      usePublicSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );
    expect(mockApi.discogsCollection).not.toHaveBeenCalled();
  });

  it("ignores unknown instance ids without touching the collection API", () => {
    const releases = releaseFactory.buildList(1);

    applyUrl("/crate/demo-crate-id?instance=unknown");

    const { result } = renderHookWithTestProviders(() =>
      usePublicSelectedReleaseModal({ fallbackReleases: releases }),
    );

    expect(result.current.selectedReleaseId).toBe("unknown");
    expect(result.current.selectedRelease).toBeNull();
    expect(mockApi.discogsCollection).not.toHaveBeenCalled();
  });
});
