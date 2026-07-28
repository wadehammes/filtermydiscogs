import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseCardPageObject } from "src/components/ReleaseCard/ReleaseCard.po";
import { ReleasesGridPageObject } from "src/components/ReleasesClient/components/ReleasesGrid.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen } from "test-utils";

let po: ReleasesGridPageObject;
let releaseCardPo: ReleaseCardPageObject;

describe("ReleasesGrid", () => {
  beforeEach(() => {
    po = new ReleasesGridPageObject();
    releaseCardPo = new ReleaseCardPageObject();
  });

  it("renders desktop release cards in card view", () => {
    po.renderReleasesGrid({ isMobile: false, view: "card" });

    expect(screen.getAllByTestId(po.desktopCardTestId)).toHaveLength(2);
    expect(screen.queryByTestId(po.mobileCardTestId)).not.toBeInTheDocument();
  });

  it("renders mobile release cards on small viewports", () => {
    releaseCardPo.setupMocks();
    po.renderReleasesGrid({ isMobile: true, view: "card" });

    expect(screen.getAllByTestId(po.mobileCardTestId)).toHaveLength(2);
    expect(screen.queryByTestId(po.desktopCardTestId)).not.toBeInTheDocument();
  });

  it("renders the table view on desktop list mode", () => {
    po.renderReleasesGrid({ isMobile: false, view: "list" });

    expect(screen.getByTestId(po.tableTestId)).toHaveTextContent(
      "2 table rows",
    );
  });

  it("shows the random release with a desktop card even on mobile", () => {
    releaseCardPo.setupMocks();
    const randomRelease = releaseFactory.withDisplayDefaults();

    po.renderReleasesGrid({
      isMobile: true,
      view: "random",
      isRandomMode: true,
      randomRelease,
      releases: [],
    });

    expect(screen.getByTestId(po.desktopCardTestId)).toBeInTheDocument();
    expect(screen.queryByTestId(po.mobileCardTestId)).not.toBeInTheDocument();
  });

  it("calls onReleaseClick when a card is activated", async () => {
    releaseCardPo.setupMocks();
    const release = releaseFactory.withEmptyNotes();
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderReleasesGrid({
      releases: [release],
      isMobile: false,
      view: "card",
      onReleaseClick,
    });

    await user.click(
      screen.getByRole("button", {
        name: `Open release details for ${release.basic_information.title}`,
      }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(String(release.instance_id));
  });
});
