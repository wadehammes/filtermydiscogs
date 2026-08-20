import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { UserActionsPageObject } from "src/components/StickyHeaderBar/UserActions.po";
import { screen, waitFor } from "test-utils";

let po: UserActionsPageObject;

const openUserMenu = async () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.click(screen.getByRole("button", { name: po.username }));

  await waitFor(() => {
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  return user;
};

describe("UserActions", () => {
  beforeEach(() => {
    po = new UserActionsPageObject();
  });

  it("renders username trigger on desktop", () => {
    po.renderUserActions({ variant: "desktop" });

    expect(
      screen.getByRole("button", { name: po.username }),
    ).toBeInTheDocument();
  });

  it("opens menu with navigation links and logout", async () => {
    po.renderUserActions({ variant: "desktop" });

    await openUserMenu();

    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("menuitem", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      screen.getByRole("menuitem", { name: "Logout" }),
    ).toBeInTheDocument();
  });

  it("opens theme submenu with palette options", async () => {
    po.renderUserActions({ variant: "desktop" });

    const user = await openUserMenu();

    await user.click(screen.getByRole("menuitem", { name: /Theme/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitemradio", { name: "Dark", hidden: true }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("menuitemradio", { name: "System", hidden: true }),
    ).toBeInTheDocument();
  });
});
