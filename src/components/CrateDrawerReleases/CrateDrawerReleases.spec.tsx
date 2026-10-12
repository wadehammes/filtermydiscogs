import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import {
  crateDrawerDefaultDetail,
  crateDrawerPackedAt,
  crateDrawerReleasePacked,
  crateDrawerReleaseUnpacked,
} from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateDrawerReleasesPageObject } from "src/components/CrateDrawerReleases/CrateDrawerReleases.po";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import { screen, waitFor } from "test-utils";

let po: CrateDrawerReleasesPageObject;

describe("CrateDrawerReleases", () => {
  beforeEach(() => {
    po = new CrateDrawerReleasesPageObject();
  });

  it("prefetches release detail when a drawer row action is hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.mockPartiallyPackedCrate();
    po.mockReleaseOpenPrefetch();

    po.renderCrateDrawerReleases({ onReleaseClick });

    try {
      await waitFor(() => {
        expect(
          screen.getByText(crateDrawerReleaseUnpacked.basic_information.title),
        ).toBeInTheDocument();
      });

      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("button", {
          name: `Remove ${crateDrawerReleaseUnpacked.basic_information.title} from crate`,
        }),
        mockDiscogsRelease: po.mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("lists staged releases in layout order without section markers", async () => {
    po.mockCrateResolved(
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

    po.renderCrateDrawerReleases();

    await waitFor(() => {
      expect(
        screen.getByText(crateDrawerReleaseUnpacked.basic_information.title),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("Peak hour")).not.toBeInTheDocument();
  });

  it("shows the packing toolbar with zero progress when gig packing is enabled", async () => {
    po.mockCrateResolved(
      crateWithReleasesResponseFactory.withReleases(crateDrawerDefaultDetail, [
        crateDrawerReleasePacked,
        crateDrawerReleaseUnpacked,
      ]),
    );

    po.renderCrateDrawerReleases();

    await waitFor(() => {
      expect(
        screen.getByText(crateDrawerReleasePacked.basic_information.title),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("0 of 2 packed for gig")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /hide albums packed for your gig/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /clear all packed items/i }),
    ).toBeDisabled();
  });

  it("shows the hide filter when at least one item is packed", async () => {
    po.mockPartiallyPackedCrate();

    po.renderCrateDrawerReleases();

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
    po.mockPartiallyPackedCrate();

    po.renderCrateDrawerReleases();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /clear all packed items/i }),
      ).toBeInTheDocument();
    });
  });

  it("clears all packed items when Clear packed is confirmed", async () => {
    po.mockPartiallyPackedCrate();
    po.mockClearAllPackedSuccess();

    const user = userEvent.setup();

    po.renderCrateDrawerReleases();

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
      expect(po.mockApi.clearAllPackedInCrate).toHaveBeenCalledWith("crate-1");
    });
  });

  it("shows staging guidance when the crate is empty", async () => {
    po.mockCrateResolved(
      crateWithReleasesResponseFactory.withReleases(
        crateDrawerDefaultDetail,
        [],
      ),
    );

    po.renderCrateDrawerReleases();

    await waitFor(() => {
      expect(screen.getByTestId("fmdEmptyState")).toBeInTheDocument();
      expect(screen.getByText(/no releases added yet/i)).toBeInTheDocument();
    });
  });

  it("shows an empty state when every album is packed and hidden", async () => {
    po.mockCrateResolved(
      crateWithReleasesResponseFactory.withReleaseItems(
        crateDrawerDefaultDetail,
        [
          {
            release: crateDrawerReleasePacked,
            found_at: crateDrawerPackedAt,
            sort_order: 1000,
          },
        ],
      ),
    );

    const user = userEvent.setup();

    po.renderCrateDrawerReleases();

    await waitFor(() => {
      expect(screen.getByText("1 of 1 packed for gig")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("checkbox", {
        name: /hide albums packed for your gig/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdEmptyState")).toBeInTheDocument();
      expect(
        screen.getByText(/all albums packed for your gig/i),
      ).toBeInTheDocument();
    });
  });
});
