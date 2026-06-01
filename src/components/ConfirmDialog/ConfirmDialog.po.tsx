import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import { render } from "test-utils";
import { ConfirmDialog } from "./ConfirmDialog.component";

export type ConfirmDialogRenderProps = {
  isOpen?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirming?: boolean;
};

export class ConfirmDialogPageObject extends BasePageObject {
  public testId = "fmdConfirmDialog";
  public title = "Confirm Action";
  public message = "Are you sure you want to proceed?";
  public confirmLabel = "Confirm";
  public cancelLabel = "Cancel";
  public onConfirm = jest.fn();
  public onCancel = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.clearAllMocks();
  }

  renderConfirmDialog(overrides: ConfirmDialogRenderProps = {}): RenderResult {
    return render(
      <ConfirmDialog
        isOpen
        title={this.title}
        message={this.message}
        onConfirm={this.onConfirm}
        onCancel={this.onCancel}
        {...overrides}
      />,
    );
  }
}
