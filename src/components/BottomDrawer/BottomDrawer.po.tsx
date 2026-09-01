import type { ReactNode } from "react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { BottomDrawer } from "./BottomDrawer.component";

export type BottomDrawerRenderProps = {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  titleId?: string;
  headerContent?: ReactNode;
  footer?: ReactNode;
  closeButtonAriaLabel?: string;
  closeButtonPlacement?: "floating" | "header";
  chrome?: boolean;
  contentFlush?: boolean;
  dataAttribute?: string;
  drawerClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  aboveMiniPlayer?: boolean;
  behindMiniPlayer?: boolean;
  hideOverlay?: boolean;
  inline?: boolean;
  children?: ReactNode;
};

export class BottomDrawerPageObject extends BasePageObject {
  public testId = "fmdBottomDrawer";
  public onClose = jest.fn();
  public drawerContent = <div>Content</div>;
  public drawerTitle = "Test Drawer";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
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
