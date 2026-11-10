import { beforeEach, describe, expect, it } from "@jest/globals";

jest.mock("youtube-video-element/react", () => {
  const React = require("react");

  return {
    __esModule: true,
    default: React.forwardRef(
      ({ src }: { src: string }, ref: React.Ref<HTMLDivElement>) => (
        <div ref={ref} data-testid="mockYoutubeVideo" data-src={src} />
      ),
    ),
  };
});

import { LoginPageObject } from "src/components/Login/Login.po";
import { LOGIN_FEATURES } from "src/components/Login/loginFeatures.constants";
import { LOGIN_PAGE_UI_COPY } from "src/constants/loginPageCopy.registry";
import { LOGIN_PREVIEW_VIDEO_URL } from "src/constants/loginPreviewMedia";
import { LOGIN_DEMO_PUBLIC_CRATE_PATH } from "src/constants/publicCrate.constants";
import { HOME_SAMPLE_PUBLIC_PLAYLIST_PATH } from "src/constants/publicPlaylist.constants";
import {
  LOGIN_PREVIEW_ALT,
  SITE_LEAD,
  SITE_TAGLINE,
} from "src/constants/siteMetadata";
import { testUnauthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { screen } from "test-utils";

let po: LoginPageObject;

describe("Login", () => {
  beforeEach(() => {
    po = new LoginPageObject();
  });

  it("renders the public auth layout shell", () => {
    po.renderLogin();
    expect(screen.getByTestId(po.layoutTestId)).toBeInTheDocument();
  });

  it("keeps the landing visible while the session is checked", () => {
    po.renderLogin({
      ...testUnauthenticatedAuthState,
      isCheckingAuth: true,
    });

    expect(screen.getByTestId(po.testId)).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getAllByRole("button", { name: "Connect with Discogs" }),
    ).toHaveLength(2);
  });

  it("renders the login landing content", () => {
    po.renderLogin();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders the connect call to action", () => {
    po.renderLogin();
    expect(
      screen.getAllByRole("button", { name: "Connect with Discogs" }),
    ).toHaveLength(2);
  });

  it("renders the bottom connect section above the footer", () => {
    po.renderLogin();
    expect(
      screen.getByRole("heading", {
        name: LOGIN_PAGE_UI_COPY.bottomCtaHeading,
      }),
    ).toBeInTheDocument();
  });

  it("renders the preview demo and hero content", () => {
    po.renderLogin();

    expect(screen.getByTestId("fmdLoginPreviewDemo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: new RegExp(SITE_TAGLINE),
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(SITE_LEAD)).toBeInTheDocument();
    expect(screen.getByLabelText(LOGIN_PREVIEW_ALT)).toBeInTheDocument();
    expect(screen.getByTestId("mockYoutubeVideo")).toHaveAttribute(
      "data-src",
      LOGIN_PREVIEW_VIDEO_URL,
    );
    expect(
      screen.getByRole("link", {
        name: LOGIN_PAGE_UI_COPY.publicShareTeaserPlaylistLinkLabel,
      }),
    ).toHaveAttribute("href", HOME_SAMPLE_PUBLIC_PLAYLIST_PATH);
    expect(
      screen.getByRole("link", {
        name: LOGIN_PAGE_UI_COPY.publicShareTeaserCrateLinkLabel,
      }),
    ).toHaveAttribute("href", LOGIN_DEMO_PUBLIC_CRATE_PATH);
  });

  it("renders feature rows and footer links", () => {
    po.renderLogin();

    for (const feature of LOGIN_FEATURES) {
      expect(screen.getByText(feature.eyebrow)).toBeInTheDocument();
      expect(screen.getByText(feature.title)).toBeInTheDocument();
      if (feature.imageAlt) {
        expect(
          screen.getByRole("img", { name: feature.imageAlt }),
        ).toBeInTheDocument();
      }
    }
    expect(
      screen.getAllByRole("link", { name: "About" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("link", { name: "Contribute to the project" }),
    ).toHaveAttribute("href", "/about#support");
    expect(screen.getByTestId("fmdPageFooterFun")).toBeInTheDocument();
    expect(
      screen.getByText("Live totals from collectors using FilterMyDisco.gs."),
    ).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("Crates created")).toBeInTheDocument();
  });
});
