import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PlaybackDockSliderPageObject } from "src/components/PlaybackDockSlider/PlaybackDockSlider.po";
import { screen } from "test-utils";

let po: PlaybackDockSliderPageObject;

const mockLayoutRect = {
  width: 240,
  height: 120,
  top: 0,
  left: 0,
  right: 240,
  bottom: 120,
  x: 0,
  y: 0,
  toJSON: () => {},
} as DOMRect;

describe("PlaybackDockSlider", () => {
  beforeEach(() => {
    po = new PlaybackDockSliderPageObject();
    jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(mockLayoutRect);
  });

  it("when oriented vertically, renders an accessible vertical slider", () => {
    po.renderPlaybackDockSlider({
      ariaLabel: "Playback volume",
      max: 100,
      min: 0,
      onValueChange: jest.fn(),
      onValueCommitted: jest.fn(),
      orientation: "vertical",
      step: 1,
      value: 70,
    });

    const root = screen.getByTestId(po.testId);

    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("data-orientation", "vertical");
  });
});
