import { beforeEach, describe, expect, it } from "@jest/globals";
import { IconButtonPageObject } from "src/components/IconButton/IconButton.po";
import { screen } from "test-utils";
import { iconButtonClasses, iconButtonIconClasses } from "./iconButtonClasses";

let po: IconButtonPageObject;

describe("IconButton", () => {
  beforeEach(() => {
    po = new IconButtonPageObject();
  });

  it("renders with shared hover variant classes", () => {
    po.renderIconButton({ variant: "close" });

    const button = screen.getByTestId(po.testId);

    expect(button.className).toContain(iconButtonClasses("close"));
    expect(button.firstElementChild?.className).toContain(
      iconButtonIconClasses(),
    );
  });
});
