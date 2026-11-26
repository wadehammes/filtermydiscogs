import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import {
  crateDrawerPartiallyPackedResponse,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateDrawerFooter } from "src/components/CrateDrawerFooter/CrateDrawerFooter.component";
import { CrateDrawerReleases } from "src/components/CrateDrawerReleases/CrateDrawerReleases.component";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("CrateDrawerDialogs", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("opens the empty crate confirm dialog from the footer More menu", async () => {
    mockApi.crate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderCrateDrawerTree(<CrateDrawerFooter />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^more$/i })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: /^more$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: /^empty$/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("menuitem", { name: /^empty$/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainOneByRole("heading", { name: "Empty Crate" });
    expect(dialog).toContainOneByText(/remove all 2 releases from/i);
  });

  it("opens the clear packed marks dialog from the packing toolbar", async () => {
    mockApi.crate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

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

    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainOneByRole("heading", {
      name: "Clear packed marks",
    });
    expect(dialog).toContainOneByText(/releases stay in the crate/i);
  });

  it("clears packed marks when confirmed", async () => {
    mockApi.crate.mockResolvedValue(crateDrawerPartiallyPackedResponse);
    mockApi.clearAllPackedInCrate.mockResolvedValue(
      crateMutationSuccessFactory.clearPacked(1),
    );

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
    mockApi.crate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

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

    expect(document.body).not.toContainAnyByRole("dialog");
    expect(mockApi.clearAllPackedInCrate).not.toHaveBeenCalled();
  });
});
