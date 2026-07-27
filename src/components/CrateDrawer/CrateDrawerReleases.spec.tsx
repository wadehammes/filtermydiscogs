import { describe, expect, it } from "@jest/globals";
import * as apiHelpers from "src/api/helpers";
import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerReleases } from "src/components/CrateDrawer/CrateDrawerReleases.component";
import {
  crateDrawerDefaultDetail,
  crateDrawerPartiallyPackedResponse,
  crateDrawerReleasePacked,
  crateDrawerReleaseUnpacked,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen, waitFor } from "test-utils";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

describe("CrateDrawerReleases", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("does not show the hide filter when no items are packed", async () => {
    mockApi.fetchCrate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(crateDrawerDefaultDetail, [
        crateDrawerReleasePacked,
        crateDrawerReleaseUnpacked,
      ]),
    );

    render(
      <CrateDrawerProvider>
        <CrateDrawerReleases />
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
        screen.getByText(crateDrawerReleasePacked.basic_information.title),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("checkbox", {
        name: /hide items marked as packed/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Hide packed items")).not.toBeInTheDocument();
  });

  it("shows the hide filter when at least one item is packed", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    render(
      <CrateDrawerProvider>
        <CrateDrawerReleases />
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
      expect(screen.getByText("1 of 2 packed")).toBeInTheDocument();
    });

    expect(screen.getByText("Hide packed items")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /hide items marked as packed/i,
      }),
    ).toBeInTheDocument();
  });
});
