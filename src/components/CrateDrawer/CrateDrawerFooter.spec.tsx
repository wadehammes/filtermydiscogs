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

  it("renders crate footer actions", async () => {
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
        screen.getByRole("button", { name: /^edit$/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /^notes$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /clear all packed items/i }),
    ).not.toBeInTheDocument();
  });
});
