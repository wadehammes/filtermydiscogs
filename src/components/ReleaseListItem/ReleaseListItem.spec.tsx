import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseListItemPageObject } from "src/components/ReleaseListItem/ReleaseListItem.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor } from "test-utils";

let po: ReleaseListItemPageObject;

describe("ReleaseListItem", () => {
  beforeEach(() => {
    po = new ReleaseListItemPageObject();
  });

  it("renders component root", () => {
    po.renderReleaseListItem();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders release information", () => {
    po.renderReleaseListItem();

    expect(
      screen.getByRole("link", { name: /Test Artist/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Test Label/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Test Album",
    );
    expect(screen.getByText("— 2020")).toBeInTheDocument();
  });

  it("displays style pills", () => {
    po.renderReleaseListItem({
      release: releaseFactory.withStyles(["Rock", "Pop"]),
    });

    expect(
      screen.getByRole("button", { name: "Filter by Rock style" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Pop style" }),
    ).toBeInTheDocument();
  });

  it("adds a release to the crate when the crate button is clicked", async () => {
    const release = releaseFactory.withEmptyNotes();
    const user = userEvent.setup();

    po.renderReleaseListItem({ release });

    await waitFor(() => {
      expect(po.mockApiHelpers.fetchCrates).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Add to crate" }));

    await waitFor(() => {
      expect(po.mockApiHelpers.addReleaseToCrate).toHaveBeenCalled();
    });
  });

  it("removes a release from the crate when it is already in the crate", async () => {
    const release = releaseFactory.withEmptyNotes();
    const user = userEvent.setup();

    po.mockCrateContainsRelease(release);
    po.renderReleaseListItem({ release });

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
    const { container } = po.renderReleaseListItem({
      release,
      isHighlighted: true,
    });

    const item = container.querySelector(".releaseItem");
    expect(item?.className).toContain("highlighted");
  });

  it("applies inCrate class when release is in crate", async () => {
    const release = releaseFactory.withEmptyNotes();
    po.mockCrateContainsRelease(release);
    const { container } = po.renderReleaseListItem({ release });

    await waitFor(() => {
      const item = container.querySelector(".releaseItem");
      expect(item?.className).toContain("inCrate");
    });
  });

  it("calls onReleaseClick when the cover is activated", async () => {
    const release = releaseFactory.withEmptyNotes();
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderReleaseListItem({ release, onReleaseClick });

    await user.click(
      screen.getByRole("button", {
        name: `Open ${release.basic_information.title} details`,
      }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(String(release.instance_id));
  });

  it("renders a View on Discogs action link", () => {
    po.renderReleaseListItem({
      release: releaseFactory.withTitle("Test Release", 456),
    });

    expect(
      screen.getByRole("link", { name: "View on Discogs" }),
    ).toHaveAttribute("href", "https://www.discogs.com/release/456");
  });
});
