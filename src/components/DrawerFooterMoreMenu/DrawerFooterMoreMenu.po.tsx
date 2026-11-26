import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { DrawerFooterMoreMenu } from "./DrawerFooterMoreMenu.component";

export type DrawerFooterMoreMenuRenderProps = {
  disabled?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export class DrawerFooterMoreMenuPageObject extends BasePageObject {
  public panelTestId = "fmdDrawerFooterMoreMenuPanel";
  public testId = "fmdDrawerFooterMoreMenu";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private DrawerFooterMoreMenuElement(
    overrides: DrawerFooterMoreMenuRenderProps = {},
  ) {
    const {
      disabled = false,
      isOpen = false,
      onOpenChange = jest.fn(),
    } = overrides;

    return (
      <DrawerFooterMoreMenu
        disabled={disabled}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        panelTestId={this.panelTestId}
        testId={this.testId}
      >
        <span>Fixture</span>
      </DrawerFooterMoreMenu>
    );
  }

  renderDrawerFooterMoreMenu(
    overrides: DrawerFooterMoreMenuRenderProps = {},
  ): RenderResult {
    return render(this.DrawerFooterMoreMenuElement(overrides));
  }

  rerenderDrawerFooterMoreMenu(
    rerender: RenderResult["rerender"],
    overrides: DrawerFooterMoreMenuRenderProps = {},
  ): void {
    rerender(this.DrawerFooterMoreMenuElement(overrides));
  }
}
