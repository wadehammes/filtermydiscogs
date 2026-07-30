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

  it("renders view/edit crate and empty actions", async () => {
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
        screen.getByRole("link", { name: /view\/edit crate/i }),
      ).toHaveAttribute("href", "/crates/crate-1");
    });

    expect(
      screen.getByRole("button", { name: /^empty$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^edit$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^notes$/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/make shareable/i)).not.toBeInTheDocument();
  });
});
