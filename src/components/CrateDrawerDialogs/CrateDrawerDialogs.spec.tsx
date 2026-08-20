import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import * as apiHelpers from "src/api/helpers";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import {
  crateDrawerPartiallyPackedResponse,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateDrawerFooter } from "src/components/CrateDrawerFooter/CrateDrawerFooter.component";
import { CrateDrawerReleases } from "src/components/CrateDrawerReleases/CrateDrawerReleases.component";
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

  it("opens the clear packed marks dialog from the packing toolbar", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /clear all packed items/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Clear packed marks" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/releases stay in the crate/i)).toBeInTheDocument();
  });

  it("clears packed marks when confirmed", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);
    mockApi.clearAllPackedInCrate.mockResolvedValue({
      success: true,
      cleared_count: 1,
    });

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /clear all packed items/i }),
    );
    await user.click(screen.getByRole("button", { name: /^clear marks$/i }));

    await waitFor(() => {
      expect(mockApi.clearAllPackedInCrate).toHaveBeenCalledWith("crate-1");
    });
  });

  it("closes the clear packed marks dialog without clearing when canceled", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /clear all packed items/i }),
    );
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockApi.clearAllPackedInCrate).not.toHaveBeenCalled();
  });
});
