import type { RenderResult } from "@testing-library/react";
import { MobileMenuHeader } from "src/components/StickyHeaderBar/MobileMenuHeader";
import { BasePageObject } from "src/tests/BasePageObject.po";
import { render } from "test-utils";

type MobileMenuHeaderRenderProps = {
  shouldShowCollectionCommand?: boolean;
  collectionCommandAriaLabel?: string;
  onCollectionCommandClick?: () => void;
};

export class MobileMenuHeaderPageObject extends BasePageObject {
  public headerTestId = "fmdMobileMenuHeader";
  public collectionCommandTestId = "fmdMobileCollectionCommandAsk";

  renderMobileMenuHeader(
    overrides: MobileMenuHeaderRenderProps = {},
  ): RenderResult {
    const {
      shouldShowCollectionCommand = true,
      collectionCommandAriaLabel = "Open collection command",
      onCollectionCommandClick = jest.fn(),
    } = overrides;

    return render(
      <MobileMenuHeader
        isOpen={false}
        isRandomMode={false}
        shouldShowFilters={true}
        shouldShowCollectionCommand={shouldShowCollectionCommand}
        collectionCommandAriaLabel={collectionCommandAriaLabel}
        appliedFilterCount={0}
        onToggleMenu={jest.fn()}
        onFiltersClick={jest.fn()}
        onRandomModeToggle={jest.fn()}
        onCollectionCommandClick={onCollectionCommandClick}
      />,
    );
  }
}
