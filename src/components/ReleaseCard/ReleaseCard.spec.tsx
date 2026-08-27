import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseCardPageObject } from "src/components/ReleaseCard/ReleaseCard.po";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor } from "test-utils";

let po: ReleaseCardPageObject;

describe("ReleaseCard", () => {
  beforeEach(() => {
    po = new ReleaseCardPageObject();
  });

  it("renders component root", () => {
    po.renderReleaseCard();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders release information", () => {
    po.renderReleaseCard();

    expect(
      screen.getByRole("link", { name: /Test Artist/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Test Label/ }),
    ).toBeInTheDocument();
    const titleElement = screen.getByRole("heading", { level: 3 });
    expect(titleElement.textContent).toBe("Test Album");
    expect(screen.getByText("2020")).toBeInTheDocument();
  });

  it("does not display date added on the card", () => {
    po.renderReleaseCard({
      release: releaseFactory.withDateAdded("2023-01-15T00:00:00Z"),
    });

    expect(screen.queryByText(/Added/)).not.toBeInTheDocument();
    expect(screen.queryByRole("time")).not.toBeInTheDocument();
  });

  it("displays style pills", () => {
    po.renderReleaseCard({
      release: releaseFactory.withStyles(["Rock", "Pop"]),
    });

    expect(
      screen.getByRole("button", { name: "Filter by Rock" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Pop" }),
    ).toBeInTheDocument();
  });

  it("displays format pills", () => {
    po.renderReleaseCard({
      release: releaseFactory.withNamedFormats(["Vinyl", "LP"]),
    });

    expect(
      screen.getByRole("button", { name: "Filter by Vinyl format" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by LP format" }),
    ).toBeInTheDocument();
  });

  it("calls addToCrate when crate button is clicked and release is not in crate", async () => {
    const release = releaseFactory.withEmptyNotes();
    const user = userEvent.setup();

    po.renderReleaseCard({ release });

    await waitFor(() => {
      expect(po.mockApiHelpers.fetchCrates).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Add to crate" }));

    await waitFor(() => {
      expect(po.mockApiHelpers.addReleaseToCrate).toHaveBeenCalled();
    });
  });

  it("calls removeFromCrate when crate button is clicked and release is in crate", async () => {
    const release = releaseFactory.withEmptyNotes();
    const user = userEvent.setup();

    po.mockCrateContainsRelease(release);
    po.renderReleaseCard({ release });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Remove from crate" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Remove from crate" }));

    await waitFor(() => {
      expect(po.mockApiHelpers.removeReleaseFromCrate).toHaveBeenCalled();
    });
  });

  it("applies highlighted class when isHighlighted is true", () => {
    const release = releaseFactory.withEmptyNotes();
    const { container } = po.renderReleaseCard({
      release,
      isHighlighted: true,
    });

    const card = container.querySelector(".releaseCard");
    expect(card?.className).toContain("highlighted");
  });

  it("applies inCrate class when release is in crate", async () => {
    const release = releaseFactory.withEmptyNotes();
    po.mockCrateContainsRelease(release);
    const { container } = po.renderReleaseCard({ release });

    await waitFor(() => {
      const card = container.querySelector(".releaseCard");
      expect(card?.className).toContain("inCrate");
    });
  });

  it("selects style pill when clicked", async () => {
    const user = userEvent.setup();

    po.renderReleaseCard({
      release: releaseFactory.withStyles(["Rock"]),
    });

    const stylePill = screen.getByRole("button", {
      name: "Filter by Rock",
    });
    await user.click(stylePill);

    expect(stylePill).toHaveClass("pillSelected");
  });

  it("selects format pill when clicked", async () => {
    const user = userEvent.setup();

    po.renderReleaseCard({
      release: releaseFactory.withNamedFormats(["Vinyl"]),
    });

    const formatPill = screen.getByRole("button", {
      name: "Filter by Vinyl format",
    });
    await user.click(formatPill);

    expect(formatPill).toHaveClass("pillSelected");
  });

  it("applies randomMode class when isRandomMode is true", () => {
    const { container } = po.renderReleaseCard({
      release: releaseFactory.withStyles(["Rock"]),
      isRandomMode: true,
    });

    const card = container.querySelector(".releaseCard");
    expect(card?.className).toContain("randomMode");
  });

  it("renders title link with correct URL", () => {
    po.renderReleaseCard({
      release: releaseFactory.withTitle("Test Release", 456),
    });

    const titleLink = screen.getByRole("link", {
      name: "Test Release",
    });
    expect(titleLink).toHaveAttribute(
      "href",
      "https://www.discogs.com/release/456",
    );
    expect(titleLink).toHaveAttribute("target", "_blank");
    expect(titleLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("uses cover_image when available", () => {
    const release = releaseFactory.withCoverImage(
      "https://example.com/cover.jpg",
      "https://example.com/thumb.jpg",
    );

    po.renderReleaseCard({ release });

    const image = screen.getByAltText(release.basic_information.title);
    expect(image).toHaveAttribute("src", expect.stringContaining("cover.jpg"));
  });

  it("falls back to thumb when cover_image is not available", () => {
    const release = releaseFactory.withThumbOnly(
      "https://example.com/thumb.jpg",
    );

    po.renderReleaseCard({ release });

    const image = screen.getByAltText(release.basic_information.title);
    expect(image).toHaveAttribute("src", expect.stringContaining("thumb.jpg"));
  });

  it("calls onReleaseClick when cover is clicked and handler is provided", async () => {
    const release = releaseFactory.withEmptyNotes();
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderReleaseCard({ release, onReleaseClick });

    await user.click(
      screen.getByRole("button", {
        name: `Open release details for ${release.basic_information.title}`,
      }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(String(release.instance_id));
  });

  it("opens release details from the overlay details button", async () => {
    const release = releaseFactory.withEmptyNotes();
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderReleaseCard({ release, onReleaseClick });

    await user.click(
      screen.getByRole("button", { name: "Open release details" }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(String(release.instance_id));
  });

  it("renders a View on Discogs overlay button when onReleaseClick is provided", () => {
    const release = releaseFactory.withTitle("Test Release", 456);

    po.renderReleaseCard({
      release,
      onReleaseClick: jest.fn(),
    });

    expect(
      screen.getByRole("link", { name: "View on Discogs" }),
    ).toHaveAttribute("href", "https://www.discogs.com/release/456");
  });

  it("shows a spinner on the add to queue button while fetching release details", async () => {
    const release = releaseFactory.withTitle("Test Album", 249504);
    const user = userEvent.setup();
    let resolveFetch!: (
      value: ReturnType<
        typeof discogsReleaseJsonFactory.withTracklistAndVideos
      >,
    ) => void;
    const fetchPromise = new Promise<
      ReturnType<typeof discogsReleaseJsonFactory.withTracklistAndVideos>
    >((resolve) => {
      resolveFetch = resolve;
    });

    po.mockApiHelpers.fetchDiscogsRelease.mockReturnValue(fetchPromise);

    po.renderReleaseCard({ release, onReleaseClick: jest.fn() });

    await user.click(
      screen.getByRole("button", {
        name: "Add Test Album to queue",
      }),
    );

    expect(
      screen.getByRole("progressbar", { name: "Loading release" }),
    ).toBeInTheDocument();

    resolveFetch(discogsReleaseJsonFactory.withTracklistAndVideos());

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Test Album is already in the queue",
        }),
      ).toBeDisabled();
    });
  });

  it("adds all playable tracks to the queue from the overlay button", async () => {
    const release = releaseFactory.withTitle("Test Album", 249504);
    const user = userEvent.setup();

    po.renderReleaseCard({ release, onReleaseClick: jest.fn() });

    await user.click(
      screen.getByRole("button", {
        name: "Add Test Album to queue",
      }),
    );

    await waitFor(() => {
      expect(po.mockApiHelpers.fetchDiscogsRelease).toHaveBeenCalledWith(
        "249504",
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Test Album is already in the queue",
        }),
      ).toBeDisabled();
    });
  });

  it("opens Discogs when title is clicked even if onReleaseClick is provided", async () => {
    const release = releaseFactory.withTitle("Test Release", 456);
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderReleaseCard({ release, onReleaseClick });

    const titleLink = screen.getByRole("link", {
      name: "Test Release",
    });

    expect(titleLink).toHaveAttribute(
      "href",
      "https://www.discogs.com/release/456",
    );

    await user.click(titleLink);

    expect(onReleaseClick).not.toHaveBeenCalled();
  });
});
