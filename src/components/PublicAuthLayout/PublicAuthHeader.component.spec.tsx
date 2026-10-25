import { beforeEach, describe, expect, it } from "@jest/globals";
import { PublicAuthHeaderPageObject } from "src/components/PublicAuthLayout/PublicAuthHeader.component.po";
import { screen } from "test-utils";

let po: PublicAuthHeaderPageObject;

describe("PublicAuthHeader", () => {
  beforeEach(() => {
    po = new PublicAuthHeaderPageObject();
  });

  it("renders the public marketing header with Log in when signed out", () => {
    po.renderPublicAuthHeader();

    expect(screen.getByTestId(po.publicPageHeaderTestId)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/api/auth/discogs",
    );
  });

  it("renders the authenticated app header on public share pages when signed in", () => {
    po.renderAuthenticatedPublicAuthHeader();

    expect(
      screen.queryByTestId(po.publicPageHeaderTestId),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Log in" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "testuser" }),
    ).toBeInTheDocument();
  });
});
