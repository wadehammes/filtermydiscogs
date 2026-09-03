import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { MobileReleaseCardPageObject } from "src/components/ReleaseCard/MobileReleaseCard.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor } from "test-utils";

let po: MobileReleaseCardPageObject;

describe("MobileReleaseCard", () => {
  beforeEach(() => {
    po = new MobileReleaseCardPageObject();
  });

  it("renders component root", () => {
    po.renderMobileReleaseCard();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders release information", () => {
    po.renderMobileReleaseCard();

    expect(
      screen.getByRole("link", { name: /Test Artist/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Test Label/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "Test Album",
    );
    expect(screen.getByText("2020")).toBeInTheDocument();
  });

  it("displays style pills", () => {
    po.renderMobileReleaseCard({
      release: releaseFactory.withStyles(["Rock"]),
    });

    expect(
      screen.getByRole("button", { name: "Filter by Rock" }),
    ).toBeInTheDocument();
  });

  it("displays format pills", () => {
    po.renderMobileReleaseCard({
      release: releaseFactory.withNamedFormats(["Vinyl", "LP"]),
    });

    expect(
      screen.getByRole("button", { name: "Filter by Vinyl format" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by LP format" }),
    ).toBeInTheDocument();
  });

  it("calls addReleaseToCrate when a crate is checked in the menu", async () => {
    const release = releaseFactory.withEmptyNotes();
    const user = userEvent.setup();

    po.renderMobileReleaseCard({ release });

    await waitFor(() => {
      expect(po.mockApiHelpers.crates).toHaveBeenCalled();
      expect(screen.getByTestId("fmdReleaseCrateMenuTrigger")).toBeEnabled();
    });

    await user.click(screen.getByTestId("fmdReleaseCrateMenuTrigger"));

    const crateName = po.defaultCrateWithCount.name;

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(crateName, "i"),
      }),
    );

    await waitFor(() => {
      expect(po.mockApiHelpers.addReleaseToCrate).toHaveBeenCalled();
    });
  });

  it("calls removeReleaseFromCrate when a crate is unchecked in the menu", async () => {
    const release = releaseFactory.withEmptyNotes();
    const user = userEvent.setup();

    po.mockCrateContainsRelease(release);
    po.renderMobileReleaseCard({ release });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenuTrigger")).toBeEnabled();
    });

    await user.click(screen.getByTestId("fmdReleaseCrateMenuTrigger"));

    const crateName = po.defaultCrateWithCount.name;

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(crateName, "i"),
      }),
    );

    await waitFor(() => {
      expect(po.mockApiHelpers.removeReleaseFromCrate).toHaveBeenCalled();
    });
  });

  it("applies highlighted class when isHighlighted is true", () => {
    const { container } = po.renderMobileReleaseCard({
      release: releaseFactory.withEmptyNotes(),
      isHighlighted: true,
    });

    const card = container.querySelector(".releaseCard");
    expect(card?.className).toContain("highlighted");
  });

  it("applies inCrate class when release is in crate", async () => {
    const release = releaseFactory.withEmptyNotes();
    po.mockCrateContainsRelease(release);
    const { container } = po.renderMobileReleaseCard({ release });

    await waitFor(() => {
      const card = container.querySelector(".releaseCard");
      expect(card?.className).toContain("inCrate");
    });
  });

  it("calls onReleaseClick when cover is clicked", async () => {
    const release = releaseFactory.withEmptyNotes();
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderMobileReleaseCard({ release, onReleaseClick });

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

    po.renderMobileReleaseCard({ release, onReleaseClick });

    await user.click(
      screen.getByRole("button", { name: "Open release details" }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(String(release.instance_id));
  });
});
