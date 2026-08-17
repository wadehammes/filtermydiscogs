import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import {
  mockCollectionLoadState,
  mockUseMediaQuery,
  ReleaseModalPageObject,
} from "src/components/ReleaseModal/ReleaseModal.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { screen, waitFor, within } from "test-utils";

const buildSimilarReleasesFixture = () => {
  const sourceRelease = releaseFactory.build({
    instance_id: "source-instance",
    basic_information: {
      ...releaseFactory.withStyles(["Techno", "Ambient"]).basic_information,
      master_id: 100,
      title: "Source Album",
    },
  });
  const similarRelease = releaseFactory.build({
    instance_id: "similar-instance",
    basic_information: {
      ...releaseFactory.withStyles(["Techno", "House"]).basic_information,
      master_id: 200,
      title: "Similar Album",
    },
  });

  return { sourceRelease, similarRelease };
};

const expectSimilarSidebar = async () => {
  await waitFor(() => {
    expect(screen.getByTestId("fmdReleaseSimilarSidebar")).toBeInTheDocument();
  });
};

let po: ReleaseModalPageObject;

describe("ReleaseModal similar sidebar", () => {
  beforeEach(() => {
    po = new ReleaseModalPageObject();
    mockUseMediaQuery.mockReturnValue(false);
  });

  it("lists similar collection releases and switches the modal on row click", async () => {
    const user = userEvent.setup();
    const { sourceRelease, similarRelease } = buildSimilarReleasesFixture();
    const onReleaseClick = jest.fn();

    po.mockAllReleases([sourceRelease, similarRelease]);
    po.renderReleaseModal({
      release: sourceRelease,
      onReleaseClick,
    });

    await expectSimilarSidebar();

    expect(screen.getByText("Similar Album")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Open Similar Album details" }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith("similar-instance");
  });

  it("renders similar releases below notes in the main scroll area on mobile", async () => {
    const { sourceRelease, similarRelease } = buildSimilarReleasesFixture();

    po.mockAllReleases([sourceRelease, similarRelease]);
    po.renderReleaseModal({ release: sourceRelease });

    await expectSimilarSidebar();

    const modalBody = screen.getByTestId("fmdReleaseModalBody");
    const notesSection = within(modalBody).getByRole("region", {
      name: "Release notes",
    });
    const similarSection = within(modalBody).getByTestId(
      "fmdReleaseSimilarSidebar",
    );

    expect(
      notesSection.compareDocumentPosition(similarSection) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders similar releases in the desktop aside column", async () => {
    const { sourceRelease, similarRelease } = buildSimilarReleasesFixture();

    mockUseMediaQuery.mockReturnValue(true);
    po.mockAllReleases([sourceRelease, similarRelease]);
    po.renderReleaseModal({ release: sourceRelease });

    await expectSimilarSidebar();

    expect(
      within(screen.getByTestId("fmdReleaseModalBody")).queryByTestId(
        "fmdReleaseSimilarSidebar",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows crate-style loading in the sidebar until the collection has fully loaded", async () => {
    const { sourceRelease, similarRelease } = buildSimilarReleasesFixture();

    mockCollectionLoadState.hasNextPage = true;
    po.mockAllReleases([sourceRelease, similarRelease]);
    po.renderReleaseModal({ release: sourceRelease });

    await expectSimilarSidebar();

    expect(screen.getByTestId("fmdPageLoader")).toBeInTheDocument();
    expect(screen.queryByText("Similar Album")).not.toBeInTheDocument();
  });
});
