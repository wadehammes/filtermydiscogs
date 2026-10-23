import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseMiniPlayerAddToMenuViewPageObject } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayerAddToMenuView.po";
import { screen, waitFor } from "test-utils";

let po: ReleaseMiniPlayerAddToMenuViewPageObject;

describe("ReleaseMiniPlayerAddToMenuView", () => {
  beforeEach(() => {
    po = new ReleaseMiniPlayerAddToMenuViewPageObject();
  });

  it("when the Add to trigger is clicked once, keeps the root menu open", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderReleaseMiniPlayerAddToMenuView();

    const trigger = screen.getByRole("button", { name: po.addToTriggerLabel });

    await user.click(trigger);

    const panel = await screen.findByTestId(po.menuPanelTestId);
    expect(panel).toBeInTheDocument();

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    expect(screen.getByTestId(po.menuPanelTestId)).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Add to crates|Manage crates/i }),
    ).toBeInTheDocument();
  });

  it("when the Crates submenu trigger is clicked, opens the crate membership panel", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderReleaseMiniPlayerAddToMenuView();

    await user.click(
      screen.getByRole("button", { name: po.addToTriggerLabel }),
    );

    await screen.findByTestId(po.menuPanelTestId);

    const cratesSubmenuItem = screen.getByRole("menuitem", {
      name: /Add to crates|Manage crates/i,
    });
    await user.click(cratesSubmenuItem);

    await waitFor(() => {
      expect(cratesSubmenuItem).toHaveAttribute("aria-expanded", "true");
    });

    expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
  });
});
