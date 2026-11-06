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

  describe("copy listen link", () => {
    const originalClipboard = navigator.clipboard;
    const originalIsSecureContext = window.isSecureContext;
    let execCommandMock: jest.Mock<(command: string) => boolean>;

    beforeEach(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window, "isSecureContext", {
        value: false,
        configurable: true,
      });
      execCommandMock = jest.fn((command: string) => {
        if (command === "copy") {
          const ta = document.body.querySelector("textarea");
          expect(ta?.value).toBe("https://filtermydisco.gs/release/249504");
        }
        return true;
      });
      Object.defineProperty(document, "execCommand", {
        value: execCommandMock,
        configurable: true,
        writable: true,
      });
      jest.spyOn(toast, "success");
    });

    afterEach(() => {
      jest.restoreAllMocks();
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
      Object.defineProperty(window, "isSecureContext", {
        value: originalIsSecureContext,
        configurable: true,
      });
      Reflect.deleteProperty(document, "execCommand");
    });

    it("copies the public listen link when Copy listen link is activated", async () => {
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
    });
  });
});
