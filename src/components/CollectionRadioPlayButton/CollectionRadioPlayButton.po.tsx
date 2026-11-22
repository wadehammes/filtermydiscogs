import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { PersistedFiltersState } from "src/types/filters.types";
import { definedProps } from "src/utils/definedProps";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { CollectionRadioPlayButton } from "./CollectionRadioPlayButton.component";

export type CollectionRadioPlayButtonRenderProps = {
  sessionFilters?: Partial<PersistedFiltersState>;
  showLabel?: boolean;
};

export class CollectionRadioPlayButtonPageObject extends BasePageObject {
  public testId = "fmdCollectionRadioPlayButton";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private collectionRadioPlayButtonElement(
    overrides: CollectionRadioPlayButtonRenderProps = {},
  ) {
    const { sessionFilters, showLabel } = overrides;

    return (
      <SeedCollectionFilters
        releases={[releaseFactory.withDisplayDefaults()]}
        {...definedProps({ sessionFilters })}
      >
        <CollectionRadioPlayButton {...definedProps({ showLabel })} />
      </SeedCollectionFilters>
    );
  }

  renderCollectionRadioPlayButton(
    overrides: CollectionRadioPlayButtonRenderProps = {},
  ): RenderResult {
    return render(this.collectionRadioPlayButtonElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
