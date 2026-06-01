import type { ReactNode } from "react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import type { RenderResult } from "src/tests/utils/test-utils";
import { render } from "src/tests/utils/test-utils";
import { BottomDrawer } from "./BottomDrawer.component";

export type BottomDrawerRenderProps = {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  headerContent?: ReactNode;
  footer?: ReactNode;
  closeButtonAriaLabel?: string;
  dataAttribute?: string;
  children?: ReactNode;
};

export class BottomDrawerPageObject extends BasePageObject {
  public testId = "fmdBottomDrawer";
  public onClose = jest.fn();
  public drawerContent = <div>Content</div>;
  public drawerTitle = "Test Drawer";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.clearAllMocks();
  }

  renderBottomDrawer(overrides: BottomDrawerRenderProps = {}): RenderResult {
    const { children = this.drawerContent, ...props } = overrides;

    return render(
      <BottomDrawer isOpen onClose={this.onClose} {...props}>
        {children}
      </BottomDrawer>,
    );
  }
}
