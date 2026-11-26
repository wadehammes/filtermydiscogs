import type { ReactElement } from "react";
import { DrawerFooterMoreMenu } from "src/components/DrawerFooterMoreMenu/DrawerFooterMoreMenu.component";
import {
  MosaicExportMenuSubmenu,
  type MosaicExportMenuSubmenuProps,
} from "src/components/MosaicExportMenu/MosaicExportMenuSubmenu.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { TestProviders } from "src/tests/utils/testProviders";
import type { DiscogsRelease } from "src/types";
import { render } from "test-utils";

jest.mock("src/hooks/useMosaicExport.hook", () => ({
  useMosaicExport: () => ({
    exportMosaic: jest.fn(),
    isGenerating: false,
  }),
}));

export type MosaicExportMenuSubmenuRenderProps =
  Partial<MosaicExportMenuSubmenuProps>;

const defaultReleases = releaseFactory.buildList(2);

export class MosaicExportMenuSubmenuPageObject extends BasePageObject {
  public menuPanelTestId = "fmdMosaicExportMenuSubmenuPanel";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private mosaicExportMenuSubmenuElement(
    overrides: MosaicExportMenuSubmenuRenderProps = {},
  ): ReactElement {
    const { releases = defaultReleases, ...rest } = overrides;

    return (
      <TestProviders includeCollectionSync={false}>
        <DrawerFooterMoreMenu
          isOpen
          onOpenChange={() => undefined}
          panelTestId={this.menuPanelTestId}
          testId="fmdMosaicExportMenuHost"
        >
          <MosaicExportMenuSubmenu releases={releases} {...rest} />
        </DrawerFooterMoreMenu>
      </TestProviders>
    );
  }

  renderMosaicExportMenuSubmenu = (
    overrides: MosaicExportMenuSubmenuRenderProps = {},
  ) => {
    return render(this.mosaicExportMenuSubmenuElement(overrides));
  };

  renderMosaicExportMenuSubmenuWithReleases = (releases: DiscogsRelease[]) =>
    this.renderMosaicExportMenuSubmenu({ releases });
}
