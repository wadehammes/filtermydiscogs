import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FiltersActionTypes } from "src/context/filters.context";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { ReleaseCardPageObject } from "./ReleaseCard.po";

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
    expect(titleElement.textContent).toBe("Test Artist - Test Album");
    expect(screen.getByText("2020")).toBeInTheDocument();
  });

  it("displays date added when available", () => {
    po.renderReleaseCard({
      release: releaseFactory.withDateAdded("2023-01-15T00:00:00Z"),
    });

    expect(screen.getByText(/Added/)).toBeInTheDocument();
    expect(screen.getByRole("time")).toHaveAttribute(
      "datetime",
      "2023-01-15T00:00:00Z",
    );
  });

  it("displays style pills", () => {
    po.renderReleaseCard({
      release: releaseFactory.withStyles(["Rock", "Pop"]),
    });

    expect(
      screen.getByRole("button", { name: "Filter by Rock style" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Pop style" }),
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
    const release = releaseFactory.build();
    po.isInCrate.mockImplementation(() => false);
    const user = userEvent.setup();

    po.renderReleaseCard({ release });

    const crateButton = screen.getByRole("button", { name: "Add to crate" });
    await user.click(crateButton);

    expect(po.addToCrate).toHaveBeenCalledWith(release);
    expect(po.openDrawer).toHaveBeenCalled();
  });

  it("calls removeFromCrate when crate button is clicked and release is in crate", async () => {
    const release = releaseFactory.build();
    po.isInCrate.mockImplementation(() => true);
    const user = userEvent.setup();

    po.renderReleaseCard({ release });

    const crateButton = screen.getByRole("button", {
      name: "Remove from crate",
    });
    await user.click(crateButton);

    expect(po.removeFromCrate).toHaveBeenCalledWith(release.instance_id);
    expect(po.addToCrate).not.toHaveBeenCalled();
  });

  it("applies highlighted class when isHighlighted is true", () => {
    const release = releaseFactory.build();
    const { container } = po.renderReleaseCard({
      release,
      isHighlighted: true,
    });

    const card = container.querySelector(".releaseCard");
    expect(card?.className).toContain("highlighted");
  });

  it("applies inCrate class when release is in crate", () => {
    const release = releaseFactory.build();
    po.isInCrate.mockImplementation(() => true);
    const { container } = po.renderReleaseCard({ release });

    const card = container.querySelector(".releaseCard");
    expect(card?.className).toContain("inCrate");
  });

  it("calls toggleStyle when style pill is clicked", async () => {
    const user = userEvent.setup();

    po.renderReleaseCard({
      release: releaseFactory.withStyles(["Rock"]),
    });

    const stylePill = screen.getByRole("button", {
      name: "Filter by Rock style",
    });
    await user.click(stylePill);

    expect(po.filtersDispatch).toHaveBeenCalledWith({
      type: FiltersActionTypes.ToggleStyle,
      payload: "Rock",
    });
  });

  it("calls toggleFormat when format pill is clicked", async () => {
    const user = userEvent.setup();

    po.renderReleaseCard({
      release: releaseFactory.withNamedFormats(["Vinyl"]),
    });

    const formatPill = screen.getByRole("button", {
      name: "Filter by Vinyl format",
    });
    await user.click(formatPill);

    expect(po.filtersDispatch).toHaveBeenCalledWith({
      type: FiltersActionTypes.ToggleFormat,
      payload: "Vinyl",
    });
  });

  it("toggles random mode when style pill is clicked in random mode", async () => {
    const onExitRandomMode = jest.fn();
    const user = userEvent.setup();

    po.mockRandomModeFilters();

    po.renderReleaseCard({
      release: releaseFactory.withStyles(["Rock"]),
      onExitRandomMode,
    });

    const stylePill = screen.getByRole("button", {
      name: "Filter by Rock style",
    });
    await user.click(stylePill);

    expect(po.filtersDispatch).toHaveBeenCalledWith({
      type: FiltersActionTypes.ToggleRandomMode,
      payload: undefined,
    });
    expect(onExitRandomMode).toHaveBeenCalled();
  });

  it("renders Discogs link with correct URL", () => {
    po.renderReleaseCard({
      release: releaseFactory.withResourceUrl(123),
    });

    const discogsLink = screen.getByRole("link", {
      name: "View on Discogs",
    });
    expect(discogsLink).toHaveAttribute(
      "href",
      "https://www.discogs.com/release/123",
    );
    expect(discogsLink).toHaveAttribute("target", "_blank");
    expect(discogsLink).toHaveAttribute("rel", "noopener noreferrer");
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
});
