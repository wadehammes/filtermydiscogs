import { beforeEach, describe, expect, it } from "@jest/globals";
import { useRouter } from "next/navigation";
import { api } from "src/api/urls";
import { useLocalSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { parseReleaseId } from "src/utils/releaseNotes";
import { act, renderHookWithTestProviders, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const mockUseRouter = jest.mocked(useRouter);

describe("useLocalSelectedReleaseModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
    );
  });

  it("prefetches release detail on click when the release is in fallbackReleases", async () => {
    const releases = releaseFactory.buildList(1);
    const release = releases[0];
    const releaseId = release ? parseReleaseId(release) : null;

    expect(releaseId).not.toBeNull();

    const mockPush = jest.fn();
    mockUseRouter.mockReturnValue(createMockAppRouter({ push: mockPush }));

    const { result } = renderHookWithTestProviders(() =>
      useLocalSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(release?.instance_id));
    });

    await waitFor(() => {
      expect(mockApi.discogsRelease).toHaveBeenCalledWith(String(releaseId));
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens and closes without updating the router", () => {
    const releases = releaseFactory.buildList(2);
    const mockPush = jest.fn();
    const mockReplace = jest.fn();
    const mockRouter = createMockAppRouter({
      push: mockPush,
      replace: mockReplace,
    });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result } = renderHookWithTestProviders(() =>
      useLocalSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      result.current.handleReleaseClick(String(releases[1]?.instance_id));
    });

    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[1]?.instance_id,
    );
    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      result.current.handleCloseModal();
    });

    expect(result.current.selectedReleaseId).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
