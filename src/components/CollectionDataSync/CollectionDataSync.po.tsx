import type { RenderResult } from "@testing-library/react";
import { CollectionDataSync } from "src/components/CollectionDataSync/CollectionDataSync.component";
import { useCollectionData } from "src/hooks/useCollectionData.hook";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";

jest.mock("src/hooks/useCollectionData.hook", () => ({
  ...jest.requireActual("src/hooks/useCollectionData.hook"),
  useCollectionData: jest.fn(),
}));

const mockUseCollectionData = jest.mocked(useCollectionData);

export class CollectionDataSyncPageObject extends BasePageObject {
  mockUseCollectionData = mockUseCollectionData;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  renderCollectionDataSync(): RenderResult {
    return render(<CollectionDataSync />);
  }
}
