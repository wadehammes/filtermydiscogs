import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { CrateDrawerPageObject } from "src/components/CrateDrawer/CrateDrawer.po";
import {
  expectFilterPopupAboveBottomDrawer,
  expectFilterPopupAbovePlaybackDock,
  openFilterSelect,
} from "src/tests/filterControlTestHelpers";
import { screen, waitFor } from "test-utils";

let po: CrateDrawerPageObject;

describe("CrateDrawer", () => {
  beforeEach(() => {
    po = new CrateDrawerPageObject();
  });

  it("renders the mobile bottom drawer when open inside the releases sidebar shell", async () => {
    po.renderCrateDrawerInSidebar(false);

    await waitFor(() => {
      expect(screen.getByTestId("fmdBottomDrawer")).toBeVisible();
    });

    expect(screen.getByTestId("fmdCrateSetNotesScratchpad")).not.toBeVisible();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /^notes$/i }));

    expect(
      screen.getByPlaceholderText("Add set notes for this gig"),
    ).toBeVisible();
  });

  it("floats the close control outside the drawer header", async () => {
    po.renderCrateDrawerInSidebar(false);

    await waitFor(() => {
      expect(screen.getByTestId("fmdBottomDrawer")).toBeVisible();
      expect(screen.getByRole("button", { name: "New Crate" })).toBeVisible();
    });

    const drawer = screen.getByTestId("fmdBottomDrawer");
    const closeButton = screen.getByRole("button", {
      name: "Close crate drawer",
    });
    const header = drawer.querySelector('[class*="headerChrome"]');

    expect(header).not.toBeNull();
    expect(header).not.toContainElement(closeButton);
    expect(drawer).toContainElement(closeButton);
    expect(closeButton.className).toContain("floatingShellClose");
    expect(screen.getByRole("button", { name: "New Crate" })).toBeVisible();
  });

  it("portals the crate selector listbox above the mobile bottom drawer", async () => {
    po.renderCrateDrawerInSidebar(false);

    await waitFor(() => {
      expect(screen.getByTestId("fmdBottomDrawer")).toBeVisible();
      expect(
        screen.getByRole("combobox", { name: /select crate/i }),
      ).toBeVisible();
    });

    await openFilterSelect("Select crate");

    const listbox = await screen.findByRole("listbox", {
      name: "Select crate",
      hidden: true,
    });
    expectFilterPopupAboveBottomDrawer(listbox);
    expectFilterPopupAbovePlaybackDock(listbox);
  });

  it("portals the crate selector listbox above the desktop releases sidebar shell", async () => {
    po.renderCrateDrawerInSidebar(true);

    await waitFor(() => {
      expect(
        document.querySelector("[data-crate-drawer-desktop]"),
      ).not.toBeNull();
      expect(
        screen.getByRole("combobox", { name: /select crate/i }),
      ).toBeVisible();
    });

    await openFilterSelect("Select crate");

    expectFilterPopupAbovePlaybackDock(
      await screen.findByRole("listbox", {
        name: "Select crate",
        hidden: true,
      }),
    );
  });
});
