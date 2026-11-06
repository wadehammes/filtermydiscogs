import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseSummaryHeroToolbar } from "src/components/ReleaseSummaryHeroToolbar/ReleaseSummaryHeroToolbar.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { toast } from "src/utils/toast";
import { render, screen, waitFor } from "test-utils";

describe("ReleaseSummaryHeroToolbar", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://filtermydisco.gs";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    jest.restoreAllMocks();
  });

  it("renders View on Discogs when the release has a Discogs URL", () => {
    const release = releaseFactory.build({
      basic_information: {
        resource_url: "https://api.discogs.com/releases/12345",
      },
    });

    render(<ReleaseSummaryHeroToolbar release={release} onClose={() => {}} />);

    expect(
      screen.getByRole("link", { name: "View on Discogs" }),
    ).toHaveAttribute("href", "https://www.discogs.com/release/12345");
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
          expect(ta?.value).toBe("https://filtermydisco.gs/release/12345");
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

    it("copies the public listen link for this release when Copy listen link is activated", async () => {
      const user = userEvent.setup();
      const release = releaseFactory.build({
        basic_information: {
          id: 12345,
          resource_url: "https://api.discogs.com/releases/12345",
        },
      });

      render(
        <ReleaseSummaryHeroToolbar release={release} onClose={() => {}} />,
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
