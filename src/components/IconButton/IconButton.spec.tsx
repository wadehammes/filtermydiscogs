import { beforeEach, describe, expect, it } from "@jest/globals";
import { IconButtonPageObject } from "src/components/IconButton/IconButton.po";
import iconButtonStyles from "src/styles/modules/icon-button.module.css";
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

  it("composes plus variant hover classes on the trigger", () => {
    po.renderIconButton({ variant: "plus", children: <svg aria-hidden /> });

    const button = screen.getByTestId(po.testId);

    expect(button.className).toContain(iconButtonClasses("plus"));
  });

  it("applies iconOnly reset layout for icon-only triggers", () => {
    po.renderIconButton({ children: <svg aria-hidden /> });

    const button = screen.getByTestId(po.testId);

    expect(button.className).toContain(iconButtonStyles.iconOnly);
    expect(button.className).not.toContain(iconButtonStyles.labeled);
  });

  it("applies labeled flex layout when icon shares a row with text", () => {
    po.renderIconButton({ label: "Views", children: <svg aria-hidden /> });

    const button = screen.getByTestId(po.testId);

    expect(button.className).toContain(iconButtonStyles.labeled);
    expect(button.className).not.toContain(iconButtonStyles.iconOnly);
    expect(button.children[0]).toHaveAttribute("aria-hidden", "true");
    expect(button.children[1]).toHaveTextContent("Views");
  });
});
