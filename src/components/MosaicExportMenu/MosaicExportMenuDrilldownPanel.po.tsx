import { Menu } from "@base-ui/react/menu";
import type { ReactElement } from "react";
import { useState } from "react";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import {
  type MosaicExportDrilldownPage,
  MosaicExportMenuDrilldownPanel,
} from "src/components/MosaicExportMenu/MosaicExportMenuDrilldownPanel.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { TestProviders } from "src/tests/utils/testProviders";
import type { MosaicImageFormat } from "src/utils/mosaicExportOptions";
import { render } from "test-utils";

jest.mock("src/hooks/useMosaicExport.hook", () => ({
  useMosaicExport: () => ({
    exportMosaic: jest.fn(),
    isGenerating: false,
  }),
}));

const MosaicExportDrilldownHarness = () => {
  const [page, setPage] = useState<MosaicExportDrilldownPage>("format");
  const [selectedFormat, setSelectedFormat] =
    useState<MosaicImageFormat | null>(null);

  return (
    <TestProviders includeCollectionSync={false}>
      <Menu.Root open onOpenChange={() => undefined}>
        <InlinePopoverMenu.Panel variant="submenu" testId="fmdMosaicDrilldown">
          <MosaicExportMenuDrilldownPanel
            releases={releaseFactory.buildList(2)}
            page={page}
            selectedFormat={selectedFormat}
            onSelectFormat={(format) => {
              setSelectedFormat(format);
              setPage("aspect");
            }}
            onBackToFormats={() => {
              setPage("format");
              setSelectedFormat(null);
            }}
          />
        </InlinePopoverMenu.Panel>
      </Menu.Root>
    </TestProviders>
  );
};

export class MosaicExportMenuDrilldownPanelPageObject extends BasePageObject {
  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderMosaicExportDrilldownPanel = () => {
    return render(this.drilldownElement());
  };

  private drilldownElement = (): ReactElement => (
    <MosaicExportDrilldownHarness />
  );
}
