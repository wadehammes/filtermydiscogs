import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import {
  crateDrawerDefaultDetail,
  crateDrawerPartiallyPackedResponse,
  crateDrawerReleasePacked,
  crateDrawerReleaseUnpacked,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateDrawerReleases } from "src/components/CrateDrawerReleases/CrateDrawerReleases.component";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("CrateDrawerReleases", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("lists staged releases in layout order without section markers", async () => {
    mockApi.crate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleaseItems(
        crateDrawerDefaultDetail,
        [
          {
            release: crateDrawerReleaseUnpacked,
            found_at: null,
            sort_order: 1000,
          },
          {
            release: releaseFactory.build({
              instance_id: "333",
              basic_information: basicInformationFactory.build({
                title: "Found Staging Release",
              }),
            }),
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

    expect(screen.queryByText("Peak hour")).not.toBeInTheDocument();
  });

  it("does not show the hide filter when no items are packed", async () => {
    mockApi.crate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(crateDrawerDefaultDetail, [
        crateDrawerReleasePacked,
        crateDrawerReleaseUnpacked,
      ]),
    );

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(
        screen.getByText(crateDrawerReleasePacked.basic_information.title),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("checkbox", {
        name: /hide albums packed for your gig/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Hide packed albums")).not.toBeInTheDocument();
  });

  it("shows the hide filter when at least one item is packed", async () => {
    mockApi.crate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(screen.getByText("1 of 2 packed for gig")).toBeInTheDocument();
    });

    expect(screen.getByText("Hide packed")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /hide albums packed for your gig/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows Clear packed in the packing toolbar when items are packed", async () => {
    mockApi.crate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });
  });

  it("clears all packed items when Clear packed is confirmed", async () => {
    mockApi.crate.mockResolvedValue(crateDrawerPartiallyPackedResponse);
    mockApi.clearAllPackedInCrate.mockResolvedValue({
      success: true,
      cleared_count: 1,
    });

    const user = userEvent.setup();

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /clear all packed items/i }),
    );
    await user.click(screen.getByRole("button", { name: /^clear marks$/i }));

    await waitFor(() => {
      expect(mockApi.clearAllPackedInCrate).toHaveBeenCalledWith("crate-1");
    });
  });

  it("shows staging guidance when the crate is empty", async () => {
    mockApi.crate.mockResolvedValue(
      crateWithReleasesResponseFactory.withReleases(
        crateDrawerDefaultDetail,
        [],
      ),
    );

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(screen.getByText(/no releases added yet/i)).toBeInTheDocument();
    });
  });
});
