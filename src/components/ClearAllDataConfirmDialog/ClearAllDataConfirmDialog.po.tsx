import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ClearAllDataConfirmDialog } from "./ClearAllDataConfirmDialog.component";

export type ClearAllDataConfirmDialogRenderProps = {
  isOpen?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
  isConfirming?: boolean;
};

export class ClearAllDataConfirmDialogPageObject extends BasePageObject {
  public testId = "fmdClearAllDataConfirmDialog";
  public onConfirm = jest.fn();
  public onClose = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  renderClearAllDataConfirmDialog(
    overrides: ClearAllDataConfirmDialogRenderProps = {},
  ): RenderResult {
    return render(
      <ClearAllDataConfirmDialog
        isOpen
        onConfirm={this.onConfirm}
        onClose={this.onClose}
        {...overrides}
      />,
    );
  }
}
