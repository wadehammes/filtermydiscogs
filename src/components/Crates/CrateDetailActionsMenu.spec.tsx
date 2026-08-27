import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import { setupCrateDrawerTests } from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateDetailActionsMenu } from "src/components/Crates/CrateDetailActionsMenu.component";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

const openCrateActionsMenu = async () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Crate actions" })).toBeEnabled();
  });

  await user.click(screen.getByRole("button", { name: "Crate actions" }));

  await waitFor(() => {
    expect(
      screen.getByRole("menu", { name: "Crate actions" }),
    ).toBeInTheDocument();
  });

  return user;
};

describe("CrateDetailActionsMenu", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("renders crate actions trigger", async () => {
    renderCrateDrawerTree(<CrateDetailActionsMenu />);

    await waitFor(() => {
      expect(
        screen.getByTestId("fmdCrateDetailHeaderActions"),
      ).toBeInTheDocument();
    });
  });

  it("opens menu with edit and delete actions", async () => {
    renderCrateDrawerTree(<CrateDetailActionsMenu />);

    await openCrateActionsMenu();

    expect(
      screen.getByRole("menuitem", { name: "Edit crate" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Delete crate/ }),
    ).toBeInTheDocument();
  });

  it("opens edit crate dialog from the menu", async () => {
    renderCrateDrawerTree(<CrateDetailActionsMenu />);

    const user = await openCrateActionsMenu();
    await user.click(screen.getByRole("menuitem", { name: "Edit crate" }));

    expect(screen.getByTestId("fmdEditCrateDialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Edit Crate" }),
    ).toBeInTheDocument();
  });
});
