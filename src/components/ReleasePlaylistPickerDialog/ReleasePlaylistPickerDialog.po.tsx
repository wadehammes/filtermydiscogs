import { Menu } from "@base-ui/react/menu";
import type { RenderResult } from "@testing-library/react";
import {
  ReleasePlaylistPickerSubmenuPanel,
  type ReleasePlaylistPickerSubmenuPanelProps,
} from "src/components/ReleasePlaylistPickerDialog/ReleasePlaylistPickerDialog.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { trackMetadataBodyFactory } from "src/tests/factories/TrackMetadataBody.factory";
import { render } from "test-utils";

export type ReleasePlaylistPickerSubmenuRenderProps =
  Partial<ReleasePlaylistPickerSubmenuPanelProps>;

const defaultProps: ReleasePlaylistPickerSubmenuPanelProps = {
  metadata: trackMetadataBodyFactory.opening(),
  trackTitle: "Opening",
};

export class ReleasePlaylistPickerDialogPageObject extends BasePageObject {
  public testId = "fmdReleasePlaylistPickerMenu";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private releasePlaylistPickerSubmenuElement(
    overrides: ReleasePlaylistPickerSubmenuRenderProps = {},
  ) {
    return (
      <Menu.Root open modal={false}>
        <Menu.SubmenuRoot open>
          <ReleasePlaylistPickerSubmenuPanel {...defaultProps} {...overrides} />
        </Menu.SubmenuRoot>
      </Menu.Root>
    );
  }

  renderReleasePlaylistPickerSubmenu(
    overrides: ReleasePlaylistPickerSubmenuRenderProps = {},
  ): RenderResult {
    return render(this.releasePlaylistPickerSubmenuElement(overrides));
  }
}
