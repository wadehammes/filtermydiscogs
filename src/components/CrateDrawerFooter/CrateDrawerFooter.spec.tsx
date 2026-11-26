import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import { setupCrateDrawerTests } from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateDrawerFooter } from "src/components/CrateDrawerFooter/CrateDrawerFooter.component";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("CrateDrawerFooter", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("renders crate management actions and open crate link on desktop", async () => {
    setupMockMatchMedia({ desktop: true });

    render(
      <CrateDrawerProvider>
        <CrateDrawerFooter />
      </CrateDrawerProvider>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
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
    expect(screen.getByRole("button", { name: /^notes$/i })).not.toBePressed();
    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).not.toBeVisible();
    expect(
      screen.getByRole("group", { name: "Crate drawer actions" }),
    ).toBeInTheDocument();
  });

  it("toggles set notes scratchpad visibility on desktop", async () => {
    setupMockMatchMedia({ desktop: true });
    const user = userEvent.setup();

    render(
      <CrateDrawerProvider>
        <CrateDrawerFooter />
      </CrateDrawerProvider>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^notes$/i })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    expect(screen.getByRole("button", { name: /^notes$/i })).toBePressed();
    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).toBeVisible();
    expect(
      screen.getByPlaceholderText("Add set notes for this gig"),
    ).toHaveFocus();

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    expect(screen.getByRole("button", { name: /^notes$/i })).not.toBePressed();
    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).not.toBeVisible();
  });

  it("toggles set notes from the mobile footer segment", async () => {
    setupMockMatchMedia({ desktop: false });
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <CrateDrawerProvider>
        <CrateDrawerFooter />
      </CrateDrawerProvider>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^notes$/i })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: /^notes$/i }));

    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).toBeVisible();
    expect(
      screen.queryByRole("switch", { name: /public link/i }),
    ).not.toBeInTheDocument();
  });
});
