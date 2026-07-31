import { describe, expect, it } from "@jest/globals";
import * as apiHelpers from "src/api/helpers";
import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerFooter } from "src/components/CrateDrawer/CrateDrawerFooter.component";
import { setupCrateDrawerTests } from "src/components/CrateDrawer/crateDrawerTestSetup";
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

  it("renders crate management actions and open crate link", async () => {
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
      expect(screen.getByRole("link", { name: /open crate/i })).toHaveAttribute(
        "href",
        "/crates/crate-1",
      );
    });

    expect(
      screen.getByRole("button", { name: /^empty$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: /public link/i }),
    ).not.toBeChecked();
    expect(
      screen.queryByRole("button", { name: /^copy link$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/only you can view this crate/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^notes$/i }),
    ).not.toBeInTheDocument();
  });
});
