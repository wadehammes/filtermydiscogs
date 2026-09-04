import { Menu } from "@base-ui/react/menu";
import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { render, screen } from "test-utils";

describe("InlinePopoverMenu", () => {
  it("opens a scrollable portaled menu panel with shared popup chrome", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <Menu.Root modal={false}>
        <Menu.Trigger>Open menu</Menu.Trigger>
        <InlinePopoverMenu.Panel scrollable useOverlayStack={false}>
          <InlinePopoverMenu.List>
            <InlinePopoverMenu.Item>One</InlinePopoverMenu.Item>
          </InlinePopoverMenu.List>
        </InlinePopoverMenu.Panel>
      </Menu.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const popup = await screen.findByRole("menu");
    expect(popup.className).toMatch(/popupScroll/);
    expect(screen.getByRole("menuitem", { name: "One" })).toBeInTheDocument();
  });
});
