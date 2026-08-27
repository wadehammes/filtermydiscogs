import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import releasesClientStyles from "src/components/ReleasesClient/ReleasesClient.module.css";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
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

describe("CrateDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setupMockMatchMedia({ desktop: false });

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
    render(
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
});
