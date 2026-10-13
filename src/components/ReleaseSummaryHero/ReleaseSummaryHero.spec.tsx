import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import {
  RELEASE_SUMMARY_HERO_RELEASE_ID,
  ReleaseSummaryHeroPageObject,
} from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.po";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { labelFactory } from "src/tests/factories/Label.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { expectReleaseCrateMenuInlineWithTrigger } from "src/tests/filterControlTestHelpers";
import { screen, waitFor } from "test-utils";

const RELEASE_ID = RELEASE_SUMMARY_HERO_RELEASE_ID;

let po: ReleaseSummaryHeroPageObject;

describe("ReleaseSummaryHero", () => {
  beforeEach(() => {
    po = new ReleaseSummaryHeroPageObject();
  });

  it("adds release to crate from the crate menu", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID);
    const user = userEvent.setup();

    po.renderReleaseSummaryHero({ release });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenuTrigger")).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Add to crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("menuitemcheckbox", {
          name: new RegExp(po.defaultCrateWithCount.name, "i"),
        }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(po.defaultCrateWithCount.name, "i"),
      }),
    );

    await waitFor(() => {
      expect(po.mockApi.addReleaseToCrate).toHaveBeenCalled();
    });
  });

  it("removes release from crate when already in crate", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID);
    const user = userEvent.setup();

    po.mockReleaseAlreadyInCrate(release);

    po.renderReleaseSummaryHero({ release });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Manage crates" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    await user.click(screen.getByRole("button", { name: "Manage crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("menuitemcheckbox", {
          name: new RegExp(po.defaultCrateWithCount.name, "i"),
        }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(po.defaultCrateWithCount.name, "i"),
      }),
    );

    await waitFor(() => {
      expect(po.mockApi.removeReleaseFromCrate).toHaveBeenCalledWith(
        po.defaultCrateWithCount.id,
        String(release.instance_id),
      );
    });
  });

  it("links artist names and title to Discogs", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        id: RELEASE_ID,
        title: "Test Album",
      },
    });
    const artist = release.basic_information.artists[0];
    if (!artist) {
      throw new Error("Expected release to include at least one artist");
    }

    po.renderReleaseSummaryHero({ release, authenticated: false });

    const artistLink = screen.getByRole("link", { name: artist.name });
    expect(artistLink).toHaveAttribute(
      "href",
      `https://www.discogs.com/artist/${artist.id}`,
    );
    expect(artistLink).toHaveAttribute("target", "_blank");
    expect(artistLink).toHaveAttribute("rel", "noopener noreferrer");

    const titleLink = screen.getByRole("link", { name: "Test Album" });
    expect(titleLink).toHaveTextContent("Test Album");
    expect(titleLink).toHaveAttribute(
      "href",
      `https://www.discogs.com/release/${RELEASE_ID}`,
    );
    expect(titleLink).toHaveAttribute("target", "_blank");
    expect(titleLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links artist names from Discogs ids when resource_url is missing", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        id: RELEASE_ID,
        artists: [
          artistFactory.build({
            name: "Test Artist",
            id: 4242,
            resource_url: "",
          }),
        ],
      },
    });

    po.renderReleaseSummaryHero({ release, authenticated: false });

    const artistLink = screen.getByRole("link", { name: "Test Artist" });
    expect(artistLink).toHaveAttribute(
      "href",
      "https://www.discogs.com/artist/4242",
    );
  });

  it("links label name to Discogs in the catalog meta line", () => {
    const label = labelFactory.build({
      name: "Dualtone Music Group",
      catno: "DT-001",
    });
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        id: RELEASE_ID,
        labels: [label],
        year: 2026,
      },
    });

    po.renderReleaseSummaryHero({ release, authenticated: false });

    const labelLink = screen.getByRole("link", {
      name: "Dualtone Music Group",
    });
    expect(labelLink).toHaveAttribute(
      "href",
      `https://www.discogs.com/label/${label.id}`,
    );
    expect(labelLink).toHaveAttribute("target", "_blank");
    expect(labelLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("DT-001")).toBeInTheDocument();
  });

  it("shows catalog metadata and community rating on separate lines", async () => {
    po.mockReleaseDetail({
      community: {
        rating: {
          average: 3.42,
          count: 45,
        },
      },
    });

    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 4,
      basic_information: {
        id: RELEASE_ID,
        labels: [labelFactory.build({ name: "Test Label", catno: "ABC-123" })],
      },
    });

    po.renderReleaseSummaryHero({ release, authenticated: false });

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
    expect(screen.queryByText(/You \d\/5/)).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseHeroRatings")).toBeInTheDocument();
      expect(screen.getByText(/3\.42 \(45\)/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/^Community /)).toBeNull();
  });

  it("shows format and genre/style filter pills below the meta line", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        id: RELEASE_ID,
        labels: [labelFactory.build({ name: "Test Label", catno: "ABC-123" })],
        formats: [formatFactory.build({ name: "Vinyl", descriptions: ["LP"] })],
        genres: ["Electronic"],
        styles: ["Rock", "Indie Rock"],
      },
    });

    po.renderReleaseSummaryHero({ release, authenticated: false });

    expect(
      screen.getByRole("button", { name: "Filter by Vinyl format" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Electronic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Rock" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Indie Rock" }),
    ).toBeInTheDocument();
  });

  it("shows the community average without a personal rating", async () => {
    po.mockReleaseDetail({
      community: {
        rating: {
          average: 4.19,
          count: 47,
        },
      },
    });

    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 4,
      basic_information: {
        id: RELEASE_ID,
      },
    });

    po.renderReleaseSummaryHero({ release, authenticated: false });

    expect(screen.queryByText(/You \d\/5/)).toBeNull();

    await waitFor(() => {
      expect(screen.getByText(/4\.19 \(47\)/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/^Community /)).toBeNull();
  });

  it("saves a rating without triggering another collection fetch", async () => {
    const user = userEvent.setup();
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 3,
      basic_information: {
        id: RELEASE_ID,
      },
    });

    po.mockDiscogsCollectionPending();
    po.mockUpdateReleaseRating(5);

    po.renderReleaseSummaryHero({ release, includeCollectionSync: true });

    await waitFor(() => {
      expect(po.mockApi.discogsCollection).toHaveBeenCalled();
    });

    const collectionFetchCount = po.mockApi.discogsCollection.mock.calls.length;

    await user.click(screen.getByRole("radio", { name: "Rate 5 out of 5" }));

    await waitFor(() => {
      expect(po.mockApi.updateReleaseRating).toHaveBeenCalledWith({
        username: "testuser",
        releaseId: RELEASE_ID,
        rating: 5,
      });
    });

    expect(po.mockApi.discogsCollection.mock.calls.length).toBe(
      collectionFetchCount,
    );
  });

  it("updates community after save with bypassCache refetch and keeps optimistic count when Discogs is stale", async () => {
    const user = userEvent.setup();

    po.mockDiscogsReleaseImplementation(po.communityReleaseDetail(4));

    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 3,
      basic_information: {
        id: RELEASE_ID,
      },
    });

    po.mockUpdateReleaseRating(5);

    po.renderReleaseSummaryHero({ release, includeCollectionSync: true });

    await waitFor(() => {
      expect(screen.getByText(/5\.00 \(4\)/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("radio", { name: "Rate 5 out of 5" }));

    await waitFor(() => {
      expect(screen.getByText(/5\.00 \(5\)/)).toBeInTheDocument();
    });

    expect(po.mockApi.discogsRelease).toHaveBeenCalledWith(String(RELEASE_ID), {
      bypassCache: true,
    });
  });

  it("completes rating save while the collection fetch is still in flight", async () => {
    const user = userEvent.setup();
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 3,
      basic_information: {
        id: RELEASE_ID,
      },
    });

    po.mockDiscogsCollectionPending();
    po.mockUpdateReleaseRating(5);

    po.renderReleaseSummaryHero({ release, includeCollectionSync: true });

    await waitFor(() => {
      expect(po.mockApi.discogsCollection).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("radio", { name: "Rate 5 out of 5" }));

    await waitFor(() => {
      expect(po.mockApi.updateReleaseRating).toHaveBeenCalledWith({
        username: "testuser",
        releaseId: RELEASE_ID,
        rating: 5,
      });
    });
  });

  it("shows an editable rating picker for authenticated users", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 3,
      basic_information: {
        id: RELEASE_ID,
      },
    });
    po.mockUpdateReleaseRating(5);

    po.renderReleaseSummaryHero({ release });

    expect(screen.getByTestId("fmdReleaseRatingPicker")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Rate 3 out of 5" }),
    ).toBeChecked();

    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: "Rate 5 out of 5" }));

    await waitFor(() => {
      expect(po.mockApi.updateReleaseRating).toHaveBeenCalledWith({
        username: "testuser",
        releaseId: RELEASE_ID,
        rating: 5,
      });
    });
  });

  it("does not show the rating picker when logged out", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 3,
    });

    po.renderReleaseSummaryHero({ release, authenticated: false });

    expect(screen.queryByTestId("fmdReleaseRatingPicker")).toBeNull();
  });

  it("portals the crate menu to document.body", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderReleaseSummaryHero({ release });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenuTrigger")).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Add to crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    expectReleaseCrateMenuInlineWithTrigger();
  });
});
