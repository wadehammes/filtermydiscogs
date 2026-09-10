import { beforeEach, describe, expect, it } from "@jest/globals";
import { SegmentedControlPageObject } from "src/components/SegmentedControl/SegmentedControl.po";
import segmentedStyles from "src/styles/modules/segmented-control.module.css";
import { screen } from "test-utils";

let po: SegmentedControlPageObject;

describe("SegmentedControl", () => {
  beforeEach(() => {
    po = new SegmentedControlPageObject();
  });

  it("renders a fieldset with a visually hidden legend and children", () => {
    po.renderSegmentedControl({ legend: "Collection view mode" });

    expect(
      screen.getByRole("group", { name: "Collection view mode" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Two" })).toBeInTheDocument();
  });

  it("applies vertical and allowOverflow container modifiers", () => {
    const { container } = po.renderSegmentedControl({
      vertical: true,
      allowOverflow: true,
      className: "custom-class",
    });

    const fieldset = container.querySelector("fieldset");

    expect(fieldset?.className).toContain(segmentedStyles.container);
    expect(fieldset?.className).toContain(segmentedStyles.containerVertical);
    expect(fieldset?.className).toContain(
      segmentedStyles.containerAllowOverflow,
    );
    expect(fieldset).toHaveClass("custom-class");
  });
});
