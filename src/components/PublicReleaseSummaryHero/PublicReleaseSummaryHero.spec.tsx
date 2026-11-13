import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { PublicReleaseSummaryHero } from "src/components/PublicReleaseSummaryHero/PublicReleaseSummaryHero.component";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupExecCommandCopyMock } from "src/tests/mocks/setupExecCommandCopyMock.mock";
import { toast } from "src/utils/toast";
import { render, screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("PublicReleaseSummaryHero", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://filtermydisco.gs";
    if (!jest.isMockFunction(mockApi.discogsRelease)) {
      Object.assign(mockApi, {
        discogsRelease: jest.fn(),
      });
    }
    jest
      .mocked(mockApi.discogsRelease)
      .mockResolvedValue(
        discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
      );
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    jest.restoreAllMocks();
  });

  it("renders format and genre/style pills as static labels", () => {
    const release = releaseFactory.build({
      basic_information: {
        formats: [{ name: "Vinyl", qty: "1" }],
        genres: ["Electronic"],
        styles: ["House"],
      },
    });

    render(
      <PublicReleaseSummaryHero
        release={release}
        titleId="public-release-modal-title"
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Vinyl")).toBeInTheDocument();
    expect(screen.getByText("Electronic")).toBeInTheDocument();
    expect(screen.getByText("House")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /filter by vinyl format/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /filter by house style/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add to crate/i }),
    ).not.toBeInTheDocument();
  });

  it("renders View on Discogs in the toolbar when resource_url is present", () => {
    const release = releaseFactory.build({
      basic_information: {
        resource_url: "https://api.discogs.com/releases/249504",
      },
    });

    render(
      <PublicReleaseSummaryHero
        release={release}
        titleId="public-release-modal-title"
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByRole("link", { name: "View on Discogs" }),
    ).toHaveAttribute("href", "https://www.discogs.com/release/249504");
  });

  it("when copy listen link is activated, copies the public listen link", async () => {
    const { execCommandMock, restore } = setupExecCommandCopyMock(
      "https://filtermydisco.gs/release/249504",
    );

    try {
      const user = userEvent.setup();
      const release = releaseFactory.build({
        basic_information: {
          id: 249504,
          resource_url: "https://api.discogs.com/releases/249504",
        },
      });

      render(
        <PublicReleaseSummaryHero
          release={release}
          titleId="public-release-modal-title"
          onClose={() => {}}
        />,
      );

      await user.click(
        screen.getByRole("button", { name: "Copy listen link" }),
      );

      await waitFor(() => {
        expect(execCommandMock).toHaveBeenCalledWith("copy");
      });
      expect(toast.success).toHaveBeenCalledWith("Link copied to clipboard");
    } finally {
      restore();
    }
  });
});
