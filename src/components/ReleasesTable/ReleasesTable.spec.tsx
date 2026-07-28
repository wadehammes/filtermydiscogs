import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleasesTablePageObject } from "src/components/ReleasesTable/ReleasesTable.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen } from "test-utils";

let po: ReleasesTablePageObject;

describe("ReleasesTable", () => {
  beforeEach(() => {
    po = new ReleasesTablePageObject();
  });

  it("renders the table with release rows", () => {
    po.renderReleasesTable();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Crate" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Artist / Title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Format/Styles" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("displays format pills in the table", () => {
    po.renderReleasesTable({
      releases: [releaseFactory.withNamedFormats(["Vinyl"])],
    });

    expect(
      screen.getByRole("button", { name: "Filter by Vinyl format" }),
    ).toBeInTheDocument();
  });

  it("calls onReleaseClick when the cover image is clicked", async () => {
    const release = releaseFactory.withDisplayDefaults();
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderReleasesTable({
      releases: [release],
      onReleaseClick,
    });

    await user.click(
      screen.getByRole("button", {
        name: `View ${release.basic_information.title}`,
      }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(String(release.instance_id));
  });
});
