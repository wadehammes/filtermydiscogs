import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import * as apiHelpers from "src/api/helpers";
import { CrateDrawerFooter } from "src/components/CrateDrawer/CrateDrawerFooter.component";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import {
  crateDrawerPartiallyPackedResponse,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

describe("CrateDrawerDialogs", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("opens the empty crate confirm dialog from the footer", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerFooter />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^empty$/i })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: /^empty$/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Empty Crate" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/remove all 2 releases from/i)).toBeInTheDocument();
  });
});
