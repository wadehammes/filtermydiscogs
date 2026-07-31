import { beforeEach, describe, expect, it } from "@jest/globals";
import * as apiHelpers from "src/api/helpers";
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

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

const defaultCrates = crateWithCountFactory.defaultCrateSelectorCrates();

describe("CrateDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setupMockMatchMedia({ desktop: false });

    mockApiResponse(
      true,
      mockApi.fetchCrates,
      cratesResponseFactory.withCrates(defaultCrates),
      new Error("Crate API request failed"),
    );

    mockApi.fetchCrate.mockImplementation(async (crateId: string) => {
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

    expect(
      screen.getByTestId("fmdCrateSetNotesScratchpad"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Add set notes for this gig"),
    ).toBeInTheDocument();
  });
});
