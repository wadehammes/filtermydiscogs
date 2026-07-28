import { beforeEach, describe, expect, it } from "@jest/globals";
import { LoginPageObject } from "src/components/Login/Login.po";
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
        name: "Ready to explore your collection?",
      }),
    ).toBeInTheDocument();
  });

  it("renders the preview demo and hero content", () => {
    po.renderLogin();

    expect(screen.getByTestId("fmdLoginPreviewDemo")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter My Discogs")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Digging made easier.",
    );
    expect(
      screen.getByText(
        "Browse and filter your collection, build crates, explore insights, and share cover-art mosaics.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "App preview showing the main interface with release cards, filters, and crate functionality",
      }),
    ).toBeInTheDocument();
  });

  it("renders feature rows and footer links", () => {
    po.renderLogin();

    expect(
      screen.getByRole("heading", { name: "Collections Insights Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Mosaics")).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Collections insights dashboard with stats, charts, and collection milestones",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Releases page with search, filters, tracklist, in-app player, and release cards",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Crate drawer with gig packing checklist and releases organized into a custom list",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Cover-art mosaic grid generated from a collection of release artwork",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Browse, search, and filter your collection"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "About" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("link", { name: "Contribute to the project" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("fmdPageFooterFun")).toBeInTheDocument();
    expect(
      screen.getByText("Live totals from collectors using FilterMyDiscogs."),
    ).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("Crates created")).toBeInTheDocument();
  });
});
