import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
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
    expect(screen.getByRole("button", { name: /^notes$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).not.toBeVisible();
  });

  it("toggles set notes scratchpad visibility", async () => {
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
      expect(screen.getByRole("button", { name: /^notes$/i })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    expect(screen.getByRole("button", { name: /^notes$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).toBeVisible();
    expect(
      screen.getByPlaceholderText("Add set notes for this gig"),
    ).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    expect(screen.getByRole("button", { name: /^notes$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).not.toBeVisible();
  });
});
