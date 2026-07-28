import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PublicReleaseCardPageObject } from "src/components/ReleaseCard/PublicReleaseCard.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen } from "test-utils";

let po: PublicReleaseCardPageObject;

describe("PublicReleaseCard", () => {
  beforeEach(() => {
    po = new PublicReleaseCardPageObject();
  });

  it("renders release title and format pills without crate controls", () => {
    const release = releaseFactory.withNamedFormats(["Vinyl"]);

    po.renderPublicReleaseCard({ release });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByText(release.basic_information.title),
    ).toBeInTheDocument();
    expect(screen.getByText("Vinyl")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("calls onReleaseClick when the cover is activated", async () => {
    const release = releaseFactory.withDisplayDefaults();
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderPublicReleaseCard({ release, onReleaseClick });

    await user.click(
      screen.getByRole("button", {
        name: `Open release details for ${release.basic_information.title}`,
      }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(String(release.instance_id));
  });
});
