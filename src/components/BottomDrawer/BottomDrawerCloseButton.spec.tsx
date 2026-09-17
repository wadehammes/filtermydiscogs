import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { BottomDrawerCloseButton } from "src/components/BottomDrawer/BottomDrawerCloseButton.component";
import { render, screen } from "test-utils";

describe("BottomDrawerCloseButton", () => {
  it("calls onClose when activated", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <BottomDrawerCloseButton
        placement="floating"
        ariaLabel="Close drawer"
        onClose={onClose}
      />,
    );

    await user.click(screen.getByTestId("fmdBottomDrawerCloseButton"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
