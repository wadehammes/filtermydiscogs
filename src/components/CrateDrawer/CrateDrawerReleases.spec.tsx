import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import * as apiHelpers from "src/api/helpers";
import { CrateDrawerReleases } from "src/components/CrateDrawer/CrateDrawerReleases.component";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import {
  crateDrawerDefaultDetail,
  crateDrawerPartiallyPackedResponse,
  crateDrawerReleasePacked,
  crateDrawerReleaseUnpacked,
  setupCrateDrawerTests,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { screen, waitFor } from "test-utils";

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

    renderCrateDrawerTree(<CrateDrawerReleases />);

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
    expect(screen.queryByText("Hide packed albums")).not.toBeInTheDocument();
  });

  it("shows the hide filter when at least one item is packed", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(screen.getByText("1 of 2 packed for gig")).toBeInTheDocument();
    });

    expect(screen.getByText("Hide packed albums")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /hide albums packed for your gig/i,
      }),
    ).toBeInTheDocument();
  });

  it("shows Clear packed in the packing toolbar when items are packed", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);

    renderCrateDrawerTree(<CrateDrawerReleases />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });
  });

  it("clears all packed items when Clear packed is confirmed", async () => {
    mockApi.fetchCrate.mockResolvedValue(crateDrawerPartiallyPackedResponse);
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
});
