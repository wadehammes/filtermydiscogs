import { beforeEach, describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { renderFeatureHook, waitFor } from "test-utils";

const mockGenerateMosaicImage = jest.fn();
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastLoading = jest.fn();
const mockToastDismiss = jest.fn();

jest.mock("src/utils/generateMosaicImage", () => ({
  generateMosaicImage: (...args: unknown[]) => mockGenerateMosaicImage(...args),
}));

jest.mock("src/utils/toast", () => ({
  toast: {
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    loading: (...args: unknown[]) => mockToastLoading(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

let useMosaicExport: typeof import("src/hooks/useMosaicExport.hook")["useMosaicExport"];

const release = releaseFactory.build();

describe("useMosaicExport", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockGenerateMosaicImage.mockResolvedValue(undefined);
    mockToastLoading.mockReturnValue("toast-loading");
    ({ useMosaicExport } = await import("src/hooks/useMosaicExport.hook"));
  });

  it("when releases is empty, shows an error toast and skips generation", async () => {
    const { result } = renderFeatureHook(() => useMosaicExport());

    await result.current.exportMosaic({
      releases: [],
      imageFormat: "jpeg",
      aspectRatio: "SQUARE",
    });

    expect(mockToastError).toHaveBeenCalledWith("No releases to export");
    expect(mockGenerateMosaicImage).not.toHaveBeenCalled();
  });

  it("when generation succeeds, shows loading then success toasts", async () => {
    const { result } = renderFeatureHook(() => useMosaicExport());

    await result.current.exportMosaic({
      releases: [release],
      imageFormat: "jpeg",
      aspectRatio: "SQUARE",
      fileNamePrefix: "Test Playlist",
    });

    expect(mockToastLoading).toHaveBeenCalledWith("Generating mosaic…");
    expect(mockGenerateMosaicImage).toHaveBeenCalledTimes(1);
    expect(mockToastSuccess).toHaveBeenCalledWith("Mosaic downloaded", {
      id: "toast-loading",
    });
  });

  it("when generation fails, shows an error toast", async () => {
    mockGenerateMosaicImage.mockRejectedValue(new Error("Canvas failed"));

    const { result } = renderFeatureHook(() => useMosaicExport());

    await result.current.exportMosaic({
      releases: [release],
      imageFormat: "png",
      aspectRatio: "LANDSCAPE",
    });

    expect(mockToastError).toHaveBeenCalledWith("Failed to generate mosaic", {
      id: "toast-loading",
    });
  });

  it("when generation is cancelled, dismisses the loading toast without an error", async () => {
    mockGenerateMosaicImage.mockRejectedValue(
      new Error("Generation cancelled"),
    );

    const { result } = renderFeatureHook(() => useMosaicExport());

    await result.current.exportMosaic({
      releases: [release],
      imageFormat: "jpeg",
      aspectRatio: "SQUARE",
    });

    expect(mockToastDismiss).toHaveBeenCalledWith("toast-loading");
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("when export is already running, does not start a second generation", async () => {
    let resolveFirst: (() => void) | undefined;
    const firstRun = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    mockGenerateMosaicImage.mockImplementation(() => firstRun);

    const { result } = renderFeatureHook(() => useMosaicExport());

    void result.current.exportMosaic({
      releases: [release],
      imageFormat: "jpeg",
      aspectRatio: "SQUARE",
    });

    await waitFor(() => {
      expect(mockGenerateMosaicImage).toHaveBeenCalledTimes(1);
    });

    await result.current.exportMosaic({
      releases: [release],
      imageFormat: "png",
      aspectRatio: "PORTRAIT",
    });

    expect(mockGenerateMosaicImage).toHaveBeenCalledTimes(1);
    resolveFirst?.();
    await firstRun;
  });
});
