import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { MobileMenuFooterMoreMenu } from "src/components/StickyHeaderBar/MobileMenuFooterMoreMenu.component";
import { render, screen, waitFor } from "test-utils";

describe("MobileMenuFooterMoreMenu", () => {
  const onNavigate = jest.fn();
  const onLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when More is opened, shows Logout and calls onLogout when chosen", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(
      <MobileMenuFooterMoreMenu onNavigate={onNavigate} onLogout={onLogout} />,
    );

    expect(
      screen.queryByRole("menuitem", { name: "Logout" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More" }));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Logout" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("menuitem", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
