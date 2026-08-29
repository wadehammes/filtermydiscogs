import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  SaveFilterViewDialog,
  type SaveFilterViewDialogProps,
} from "./SaveFilterViewDialog.component";

export type SaveFilterViewDialogRenderProps =
  Partial<SaveFilterViewDialogProps>;

export class SaveFilterViewDialogPageObject extends BasePageObject {
  public testId = "fmdSaveFilterViewDialog";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private SaveFilterViewDialogElement(
    overrides: SaveFilterViewDialogRenderProps = {},
  ) {
    return (
      <SaveFilterViewDialog
        isOpen={true}
        onClose={jest.fn()}
        onSave={jest.fn(() => true)}
        {...overrides}
      />
    );
  }

  renderSaveFilterViewDialog(
    overrides: SaveFilterViewDialogRenderProps = {},
  ): RenderResult {
    return render(this.SaveFilterViewDialogElement(overrides));
  }
}
