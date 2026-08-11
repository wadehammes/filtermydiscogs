import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { CollectionDataSync } from "./CollectionDataSync.component";

export class CollectionDataSyncPageObject extends BasePageObject {
  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  renderCollectionDataSync(): RenderResult {
    return render(<CollectionDataSync />);
  }
}
