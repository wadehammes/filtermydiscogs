import { beforeEach, describe, expect, it } from "@jest/globals";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import { act, renderHookWithTestProviders } from "test-utils";

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
    mockUsePathname.mockReturnValue("/releases");
    applyUrl("/releases");
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

  it("closes optimistically before the router clears search params", () => {
    const releases = releaseFactory.buildList(1);
    const mockReplace = jest.fn();
    const mockPush = jest.fn((url: string) => {
      applyUrl(url);
    });
    const mockRouter = createMockAppRouter({
      push: mockPush,
      replace: mockReplace,
    });

    mockUseRouter.mockReturnValue(mockRouter);

    const { result } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    act(() => {
      result.current.handleCloseModal();
    });

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

  it("ignores unknown instance ids in the URL", () => {
    const releases = releaseFactory.buildList(1);

    applyUrl("/releases?instance=unknown");

    const { result } = renderHookWithTestProviders(() =>
      useSelectedReleaseModal({ fallbackReleases: releases }),
    );

    expect(result.current.selectedReleaseId).toBe("unknown");
    expect(result.current.selectedRelease).toBeNull();
  });
});
