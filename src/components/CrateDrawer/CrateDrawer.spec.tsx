import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import releasesClientStyles from "src/components/ReleasesClient/ReleasesClient.module.css";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import {
  expectFilterPopupAboveBottomDrawer,
  expectFilterPopupAbovePlaybackDock,
  openFilterSelect,
} from "src/tests/filterControlTestHelpers";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

const defaultCrates = crateWithCountFactory.defaultCrateSelectorCrates();

const renderCrateDrawerInSidebar = (desktop: boolean) => {
  setupMockMatchMedia({ desktop });

  return render(
    <div className={releasesClientStyles.sidebar}>
      <CrateDrawer isOpen />
    </div>,
    {
      wrapper: ({ children }) => (
        <TestProviders authInitialState={testAuthenticatedAuthState}>
          {children}
        </TestProviders>
      ),
    },
  );
};

describe("CrateDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockApiResponse(
      true,
      mockApi.crates,
      cratesResponseFactory.withCrates(defaultCrates),
      new Error("Crate API request failed"),
    );

    mockApi.crate.mockImplementation(async (crateId: string) => {
      const crate = defaultCrates.find((entry) => entry.id === crateId);
      if (!crate) {
        throw new Error(`Crate not found: ${crateId}`);
      }

      const { releaseCount: _releaseCount, ...crateWithoutCount } = crate;
      return crateWithReleasesResponseFactory.withReleases(
        crateWithoutCount,
        [],
      );
    });
  });

  it("renders the mobile bottom drawer when open inside the releases sidebar shell", async () => {
    renderCrateDrawerInSidebar(false);

    await waitFor(() => {
      expect(screen.getByTestId("fmdBottomDrawer")).toBeVisible();
    });

    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).not.toBeVisible();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /^notes$/i }));

    expect(
      screen.getByPlaceholderText("Add set notes for this gig"),
    ).toBeVisible();
  });

  it("floats the close control outside the drawer header", async () => {
    renderCrateDrawerInSidebar(false);

    await waitFor(() => {
      expect(screen.getByTestId("fmdBottomDrawer")).toBeVisible();
      expect(screen.getByRole("button", { name: "New Crate" })).toBeVisible();
    });

    const drawer = screen.getByTestId("fmdBottomDrawer");
    const closeButton = screen.getByRole("button", {
      name: "Close crate drawer",
    });
    const header = drawer.querySelector('[class*="headerChrome"]');

    expect(header).not.toBeNull();
    expect(header).not.toContainElement(closeButton);
    expect(drawer).toContainElement(closeButton);
    expect(closeButton.className).toContain("floatingShellClose");
    expect(screen.getByRole("button", { name: "New Crate" })).toBeVisible();
  });

  it("portals the crate selector listbox above the mobile bottom drawer", async () => {
    renderCrateDrawerInSidebar(false);

    await waitFor(() => {
      expect(screen.getByTestId("fmdBottomDrawer")).toBeVisible();
      expect(
        screen.getByRole("combobox", { name: /select crate/i }),
      ).toBeVisible();
    });

    await openFilterSelect("Select crate");

    const listbox = await screen.findByRole("listbox", {
      name: "Select crate",
      hidden: true,
    });
    expectFilterPopupAboveBottomDrawer(listbox);
    expectFilterPopupAbovePlaybackDock(listbox);
  });

  it("portals the crate selector listbox above the desktop releases sidebar shell", async () => {
    renderCrateDrawerInSidebar(true);

    await waitFor(() => {
      expect(
        document.querySelector("[data-crate-drawer-desktop]"),
      ).toBeTruthy();
      expect(
        screen.getByRole("combobox", { name: /select crate/i }),
      ).toBeVisible();
    });

    await openFilterSelect("Select crate");

    expectFilterPopupAbovePlaybackDock(
      await screen.findByRole("listbox", {
        name: "Select crate",
        hidden: true,
      }),
    );
  });
});
