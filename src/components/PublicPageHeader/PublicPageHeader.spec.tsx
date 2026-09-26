import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { PublicPageHeaderPageObject } from "src/components/PublicPageHeader/PublicPageHeader.po";
import { screen, within } from "test-utils";

let po: PublicPageHeaderPageObject;

describe("PublicPageHeader", () => {
  beforeEach(() => {
    po = new PublicPageHeaderPageObject();
  });

  it("opens the mobile menu drawer with public nav links", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    po.renderPublicPageHeader({ currentPage: "about" });

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();

    const drawer = screen.getByRole("dialog", { name: "Menu" });
    expect(
      within(drawer).getByRole("link", { name: "Home" }),
    ).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "About" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(drawer).getByRole("link", { name: "Log in" }),
    ).toHaveAttribute("href", "/api/auth/discogs");
  });
});
