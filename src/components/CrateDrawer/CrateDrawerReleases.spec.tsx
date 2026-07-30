import { describe, expect, it } from "@jest/globals";
import * as apiHelpers from "src/api/helpers";
import { CrateDrawerReleases } from "src/components/CrateDrawer/CrateDrawerReleases.component";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import {
  crateDrawerDefaultDetail,
  crateDrawerReleaseUnpacked,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

describe("CrateDrawerReleases", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("lists staged releases without section markers or packing controls", async () => {
    mockApi.fetchCrate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleaseItems(
        crateDrawerDefaultDetail,
        [
          {
            release: crateDrawerReleaseUnpacked,
            found_at: null,
            sort_order: 1000,
          },
          {
            release: releaseFactory.build({ instance_id: "333" }),
            found_at: "2026-07-27T00:00:00.000Z",
            sort_order: 2000,
          },
        ],
        {
          markers: [{ id: "marker-1", label: "Peak hour", sort_order: 1500 }],
        },
      ),
    );

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(
        screen.getByText(crateDrawerReleaseUnpacked.basic_information.title),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(/releases staged/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Peak hour")).not.toBeInTheDocument();
    expect(screen.queryByText(/packed for gig/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Hide packed albums")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /clear all packed items/i }),
    ).not.toBeInTheDocument();
  });

  it("shows staging guidance when the crate is empty", async () => {
    mockApi.fetchCrate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(
        crateDrawerDefaultDetail,
        [],
      ),
    );

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(screen.getByText(/no releases added yet/i)).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/open the crate page to order releases/i),
    ).not.toBeInTheDocument();
  });
});
