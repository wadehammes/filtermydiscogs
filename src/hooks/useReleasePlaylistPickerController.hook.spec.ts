import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act } from "@testing-library/react";
import { useReleasePlaylistPickerController } from "src/hooks/useReleasePlaylistPickerController.hook";
import { trackMetadataBodyFactory } from "src/tests/factories/TrackMetadataBody.factory";
import { renderFeatureHook } from "test-utils";

describe("useReleasePlaylistPickerController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when opening the create playlist dialog, calls onRequestCloseMenu", () => {
    const onRequestCloseMenu = jest.fn();
    const metadata = trackMetadataBodyFactory.opening();

    const { result } = renderFeatureHook(() =>
      useReleasePlaylistPickerController({
        metadata,
        trackTitle: "Opening",
        onRequestCloseMenu,
      }),
    );

    act(() => {
      result.current.submenuPanelProps?.onOpenCreateDialog();
    });

    expect(onRequestCloseMenu).toHaveBeenCalledTimes(1);
    expect(result.current.createDialogProps.isOpen).toBe(true);
  });
});
