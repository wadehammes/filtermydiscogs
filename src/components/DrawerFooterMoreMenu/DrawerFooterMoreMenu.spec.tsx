import { beforeEach, describe, expect, it } from "@jest/globals";
import { DrawerFooterMoreMenuPageObject } from "src/components/DrawerFooterMoreMenu/DrawerFooterMoreMenu.po";
import { screen } from "test-utils";

let po: DrawerFooterMoreMenuPageObject;

describe("DrawerFooterMoreMenu", () => {
  beforeEach(() => {
    po = new DrawerFooterMoreMenuPageObject();
  });

  it("renders the More trigger", () => {
    po.renderDrawerFooterMoreMenu();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it("disables the More trigger when disabled is true", () => {
    po.renderDrawerFooterMoreMenu({ disabled: true });

    expect(screen.getByRole("button", { name: "More" })).toBeDisabled();
  });
});
