import { describe, expect, it } from "@jest/globals";
import { ReleasePlaybackVideoPanelChrome } from "src/components/ReleasePlaybackVideoPanel/ReleasePlaybackVideoPanelChrome.component";
import { render, screen } from "test-utils";

describe("ReleasePlaybackVideoPanelChrome", () => {
  it("renders draggable chrome affordances in floating layout", () => {
    render(
      <ReleasePlaybackVideoPanelChrome
        useFloatingLayout
        onDragPointerDown={() => undefined}
        onResetLayout={() => undefined}
        onResizePointerDown={() => () => undefined}
      />,
    );

    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanelHandle"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanelResetButton"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanelResizeHandle"),
    ).toBeInTheDocument();
  });
});
