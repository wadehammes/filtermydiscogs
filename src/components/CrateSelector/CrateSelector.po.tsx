import { mocked } from "jest-mock";
import { useCrate } from "src/context/crate.context";
import { useCreateCrateMutation } from "src/hooks/queries/useCrateMutations";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import { defaultCrateSelectorCrates } from "src/tests/factories/CrateWithCount.factory";
import type { RenderResult } from "src/tests/utils/test-utils";
import { render } from "src/tests/utils/test-utils";
import { CrateSelector } from "./CrateSelector.component";

jest.mock("src/context/crate.context");
jest.mock("src/hooks/queries/useCrateMutations");

const mockUseCrate = mocked(useCrate);
const mockUseCreateCrateMutation = mocked(useCreateCrateMutation);

export type CrateSelectorRenderProps = {
  className?: string;
};

export class CrateSelectorPageObject extends BasePageObject {
  public testId = "fmdCrateSelector";
  public selectCrate = jest.fn();
  public createCrate = jest.fn();
  public crates = defaultCrateSelectorCrates();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupDefaultMocks();
  }

  setupDefaultMocks() {
    jest.clearAllMocks();
    mockUseCrate.mockReturnValue({
      crates: this.crates,
      activeCrateId: "1",
      selectCrate: this.selectCrate,
      createCrate: this.createCrate,
      isLoading: false,
    } as unknown as ReturnType<typeof useCrate>);

    mockUseCreateCrateMutation.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useCreateCrateMutation>);
  }

  mockLoading() {
    mockUseCrate.mockReturnValue({
      crates: [],
      activeCrateId: null,
      selectCrate: this.selectCrate,
      createCrate: this.createCrate,
      isLoading: true,
    } as unknown as ReturnType<typeof useCrate>);
  }

  mockPendingMutation() {
    mockUseCreateCrateMutation.mockReturnValue({
      isPending: true,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useCreateCrateMutation>);
  }

  renderCrateSelector(overrides: CrateSelectorRenderProps = {}): RenderResult {
    return render(<CrateSelector {...overrides} />);
  }
}
