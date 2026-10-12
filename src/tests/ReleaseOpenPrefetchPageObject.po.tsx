import { api } from "src/api/urls";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { setupReleaseOpenPrefetchApiMocks } from "src/tests/mocks/setupReleaseOpenPrefetchApiMocks";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

export class ReleaseOpenPrefetchPageObject extends BasePageObject {
  public mockApi = mockApi;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupReleaseOpenPrefetchMocks();
  }

  setupReleaseOpenPrefetchMocks(releaseId = 249504): void {
    jest.clearAllMocks();
    setupReleaseOpenPrefetchApiMocks(this.mockApi, { releaseId });
  }
}
