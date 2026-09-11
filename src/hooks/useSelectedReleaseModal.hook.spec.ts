import { beforeEach, describe, expect, it } from "@jest/globals";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "src/api/urls";
import {
  useLocalSelectedReleaseModal,
  useSelectedReleaseModal,
} from "src/hooks/useSelectedReleaseModal.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { parseReleaseId } from "src/utils/releaseNotes";
import { act, renderHookWithTestProviders, waitFor } from "test-utils";

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

describe("useSelectedReleaseModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
    );
    mockUsePathname.mockReturnValue("/releases");
    applyUrl("/releases");
  });

  it("keeps an optimistic open when the URL still has no instance param", () => {
    const releases = releaseFactory.buildList(1);
    const mockPush = jest.fn();
    const mockRouter = createMockAppRouter({ push: mockPush });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    rerender();

    act(() => {
      applyUrl("/releases");
    });

    rerender();

    expect(result.current.selectedReleaseId).toBe(
      String(releases[0]?.instance_id),
    );
    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );
  });

  it("opens optimistically before the router updates search params", () => {
    const releases = releaseFactory.buildList(1);
    const mockPush = jest.fn();
    const mockRouter = createMockAppRouter({ push: mockPush });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    expect(mockPush).toHaveBeenCalledWith(
      `/releases?instance=${releases[0]?.instance_id}`,
      { scroll: false },
    );
    expect(result.current.selectedReleaseId).toBe(
      String(releases[0]?.instance_id),
    );
    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );
  });

  it("clears the selection after the router removes the instance param", () => {
    const releases = releaseFactory.buildList(1);
    const mockReplace = jest.fn(
      (url: string, _options?: { scroll?: boolean }) => {
        applyUrl(url);
      },
    );
    const mockPush = jest.fn((url: string, _options?: { scroll?: boolean }) => {
      applyUrl(url);
    });
    const mockRouter = createMockAppRouter({
      push: mockPush,
      replace: mockReplace,
    });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    rerender();

    act(() => {
      result.current.handleCloseModal();
    });

    rerender();

    expect(mockReplace).toHaveBeenCalledWith("/releases", { scroll: false });
    expect(result.current.selectedReleaseId).toBeNull();
    expect(result.current.selectedRelease).toBeNull();
  });

  it("opens the modal with router.push and resolves the release from the URL", () => {
    const releases = releaseFactory.buildList(2);
    const mockPush = jest.fn((url: string) => {
      applyUrl(url);
    });
    const mockRouter = createMockAppRouter({ push: mockPush });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    rerender();

    expect(mockPush.mock.calls[0]?.[0]).toBe(
      `/releases?instance=${releases[0]?.instance_id}`,
    );
    expect(result.current.selectedReleaseId).toBe(
      String(releases[0]?.instance_id),
    );
    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );
  });

  it("resolves the new release optimistically before the router updates the URL", () => {
    const releases = releaseFactory.buildList(2);
    const mockPush = jest.fn((url: string) => {
      if (mockPush.mock.calls.length === 1) {
        applyUrl(url);
      }
    });
    const mockRouter = createMockAppRouter({ push: mockPush });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    rerender();

    act(() => {
      result.current.handleReleaseClick(String(releases[1]?.instance_id));
    });

    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[1]?.instance_id,
    );
    expect(mockPush.mock.calls[1]?.[0]).toBe(
      `/releases?instance=${releases[1]?.instance_id}`,
    );
  });

  it("pushes the URL when switching releases inside the modal", () => {
    const releases = releaseFactory.buildList(2);
    const mockPush = jest.fn((url: string) => {
      applyUrl(url);
    });
    const mockRouter = createMockAppRouter({
      push: mockPush,
    });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    rerender();

    act(() => {
      result.current.handleReleaseClick(String(releases[1]?.instance_id));
    });

    rerender();

    expect(mockPush.mock.calls[1]?.[0]).toBe(
      `/releases?instance=${releases[1]?.instance_id}`,
    );
    expect(mockPush).toHaveBeenCalledTimes(2);
    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[1]?.instance_id,
    );
  });

  it("returns to the first release when the browser goes back after a similar switch", () => {
    const releases = releaseFactory.buildList(2);
    const mockPush = jest.fn((url: string) => {
      applyUrl(url);
    });
    const mockRouter = createMockAppRouter({
      push: mockPush,
    });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    rerender();

    act(() => {
      result.current.handleReleaseClick(String(releases[1]?.instance_id));
    });

    rerender();

    act(() => {
      applyUrl(`/releases?instance=${releases[0]?.instance_id}`);
    });

    rerender();

    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );
  });

  it("closes an in-session modal by replacing the pre-modal URL", () => {
    const releases = releaseFactory.buildList(1);
    const mockReplace = jest.fn((url: string) => {
      applyUrl(url);
    });
    const mockPush = jest.fn((url: string) => {
      applyUrl(url);
    });
    const mockRouter = createMockAppRouter({
      push: mockPush,
      replace: mockReplace,
    });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    rerender();

    act(() => {
      result.current.handleCloseModal();
    });

    rerender();

    expect(mockReplace.mock.calls[0]?.[0]).toBe("/releases");
    expect(result.current.selectedReleaseId).toBeNull();
  });

  it("closes a direct-link modal by replacing the URL", () => {
    const releases = releaseFactory.buildList(1);
    const mockReplace = jest.fn((url: string) => {
      applyUrl(url);
    });
    const mockRouter = createMockAppRouter({ replace: mockReplace });

    mockUseRouter.mockReturnValue(mockRouter);
    applyUrl(`/releases?instance=${releases[0]?.instance_id}`);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleCloseModal();
    });

    rerender();

    expect(mockReplace.mock.calls[0]?.[0]).toBe("/releases");
    expect(result.current.selectedReleaseId).toBeNull();
  });

  it("does not fetch the collection when resolving a release from fallbackReleases", () => {
    const releases = releaseFactory.buildList(1);
    const mockPush = jest.fn();
    const mockRouter = createMockAppRouter({ push: mockPush });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result } = renderHookWithTestProviders(
      () =>
        useSelectedReleaseModal({
          fallbackReleases: releases,
          collectionUsername: testAuthenticatedAuthState.username,
        }),
      { includeCollectionSync: false },
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );
    expect(mockApi.discogsCollection).not.toHaveBeenCalled();
  });

  it("fetches release detail on click when the cache is empty", async () => {
    const releases = releaseFactory.buildList(1);
    const release = releases[0];
    const releaseId = release ? parseReleaseId(release) : null;

    expect(releaseId).not.toBeNull();

    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: releaseId ?? 0 }),
    );

    const mockPush = jest.fn();
    const mockRouter = createMockAppRouter({ push: mockPush });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(release?.instance_id));
    });

    await waitFor(() => {
      expect(mockApi.discogsRelease).toHaveBeenCalledWith(
        String(releaseId),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  it("does not fetch release detail again when the cache already has data", async () => {
    const releases = releaseFactory.buildList(1);
    const release = releases[0];
    const releaseId = release ? parseReleaseId(release) : null;

    expect(releaseId).not.toBeNull();

    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: releaseId ?? 0 }),
    );

    const mockPush = jest.fn((url: string) => {
      applyUrl(url);
    });
    const mockRouter = createMockAppRouter({ push: mockPush });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result, rerender } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(release?.instance_id));
    });

    await waitFor(() => {
      expect(mockApi.discogsRelease).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.handleCloseModal();
    });

    rerender();

    act(() => {
      result.current.handleReleaseClick(String(release?.instance_id));
    });

    expect(mockApi.discogsRelease).toHaveBeenCalledTimes(1);
  });

  it("ignores unknown instance ids in the URL", () => {
    const releases = releaseFactory.buildList(1);

    applyUrl("/releases?instance=unknown");

    const { result } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    expect(result.current.selectedReleaseId).toBe("unknown");
    expect(result.current.selectedRelease).toBeNull();
    expect(mockApi.discogsCollection).not.toHaveBeenCalled();
  });
});

describe("useLocalSelectedReleaseModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
    );
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
