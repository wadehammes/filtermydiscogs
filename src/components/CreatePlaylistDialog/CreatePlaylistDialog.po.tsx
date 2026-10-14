import type { RenderResult } from "@testing-library/react";
import {
  CreatePlaylistDialog,
  type CreatePlaylistDialogProps,
} from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";

export type CreatePlaylistDialogRenderProps =
  Partial<CreatePlaylistDialogProps>;

const defaultProps: CreatePlaylistDialogProps = {
  isOpen: true,
  onClose: () => {},
  onCreate: async () => {},
};

export class CreatePlaylistDialogPageObject extends BasePageObject {
  public testId = "fmdCreatePlaylistDialog";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private CreatePlaylistDialogElement(
    overrides: CreatePlaylistDialogRenderProps = {},
  ) {
    return <CreatePlaylistDialog {...defaultProps} {...overrides} />;
  }

  renderCreatePlaylistDialog(
    overrides: CreatePlaylistDialogRenderProps = {},
  ): RenderResult {
    return render(this.CreatePlaylistDialogElement(overrides));
  }

  rerenderCreatePlaylistDialog(
    rerender: RenderResult["rerender"],
    overrides: CreatePlaylistDialogRenderProps = {},
  ): void {
    rerender(this.CreatePlaylistDialogElement(overrides));
  }
}
