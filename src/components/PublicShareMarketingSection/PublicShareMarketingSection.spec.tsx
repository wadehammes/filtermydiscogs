import { describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react";
import { PublicShareMarketingSectionPageObject } from "src/components/PublicShareMarketingSection/PublicShareMarketingSection.po";
import { SITE_LEAD } from "src/constants/siteMetadata";

describe("PublicShareMarketingSection", () => {
  let po: PublicShareMarketingSectionPageObject;

  beforeEach(() => {
    po = new PublicShareMarketingSectionPageObject();
  });

  it("renders About lede and Learn more without spotlight or feature lists", () => {
    po.renderPublicShareMarketingSection();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(screen.getByText(SITE_LEAD)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.queryByText(/Shared playlist/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/like this one/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Terms & Privacy" }),
    ).toHaveAttribute("href", "/legal");
  });
});
