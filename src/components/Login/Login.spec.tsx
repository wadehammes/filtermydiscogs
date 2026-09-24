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
import {
  LOGIN_DEMO_PUBLIC_CRATE_PATH,
  LOGIN_PAGE_UI_COPY,
} from "src/constants/loginPageCopy.registry";
import { LOGIN_PREVIEW_VIDEO_URL } from "src/constants/loginPreviewMedia";
import {
  LOGIN_PREVIEW_ALT,
  SITE_LEAD,
  SITE_TAGLINE,
} from "src/constants/siteMetadata";
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
        name: "Ready to connect your collection?",
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
        name: LOGIN_PAGE_UI_COPY.publicCrateLinkLabel,
      }),
    ).toHaveAttribute("href", LOGIN_DEMO_PUBLIC_CRATE_PATH);
  });

  it("renders feature rows and footer links", () => {
    po.renderLogin();

    expect(
      screen.getByRole("heading", { name: "Collection insights dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Mosaics")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Collections insights dashboard with stats, charts, on-repeat track leaders, and collection milestones",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Releases page with search, filters, tracklist, in-app player, and release cards",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Crate page with drag reorder, section groups, set notes, and gig packing checklist",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Cover-art mosaic grid generated from a collection of release artwork",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Browse, search, and filter")).toBeInTheDocument();
    expect(screen.getByText("Organize and share crates")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "About" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("link", { name: "Contribute to the project" }),
    ).toHaveAttribute("href", "/about#support");
    expect(screen.getByTestId("fmdPageFooterFun")).toBeInTheDocument();
    expect(
      screen.getByText("Live totals from collectors using FilterMyDiscogs."),
    ).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("Crates created")).toBeInTheDocument();
  });
});
