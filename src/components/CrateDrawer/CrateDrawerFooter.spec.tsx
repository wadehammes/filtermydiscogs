import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import * as apiHelpers from "src/api/helpers";
import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerFooter } from "src/components/CrateDrawer/CrateDrawerFooter.component";
import {
  crateDrawerPartiallyPackedResponse,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen, waitFor } from "test-utils";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

describe("CrateDrawerFooter", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("shows Clear packed in the footer segment when items are packed", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    render(
      <CrateDrawerProvider>
        <CrateDrawerFooter />
      </CrateDrawerProvider>,
      {
        wrapper: ({ children }) => (
          <TestProviders authInitialState={testAuthenticatedAuthState}>
            {children}
          </TestProviders>
        ),
      },
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });
  });

  it("clears all packed items when Clear packed is clicked", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);
    mockApi.clearAllPackedInCrate.mockResolvedValue({
      success: true,
      cleared_count: 1,
    });

    const user = userEvent.setup();

    render(
      <CrateDrawerProvider>
        <CrateDrawerFooter />
      </CrateDrawerProvider>,
      {
        wrapper: ({ children }) => (
          <TestProviders authInitialState={testAuthenticatedAuthState}>
            {children}
          </TestProviders>
        ),
      },
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /clear all packed items/i }),
    );

    await waitFor(() => {
      expect(mockApi.clearAllPackedInCrate).toHaveBeenCalledWith("crate-1");
    });
  });
});
