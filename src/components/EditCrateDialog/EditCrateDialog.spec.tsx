import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { renderCrateDrawerTree } from "src/components/CrateDrawer/crateDrawerTestRender";
import { setupCrateDrawerTests } from "src/components/CrateDrawer/crateDrawerTestSetup";
import { CrateDetailActionsMenu } from "src/components/Crates/CrateDetailActionsMenu.component";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

const openEditCrateDialog = async () => {
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

  await user.click(screen.getByRole("menuitem", { name: "Edit crate" }));
};

describe("EditCrateDialog", () => {
  beforeEach(() => {
    setupCrateDrawerTests(mockApi);
  });

  it("renders FormDialog fields for rename and gig packing checkbox", async () => {
    renderCrateDrawerTree(<CrateDetailActionsMenu />);

    await waitFor(() => {
      expect(
        screen.getByTestId("fmdCrateDetailHeaderActions"),
      ).toBeInTheDocument();
    });

    await openEditCrateDialog();

    expect(screen.getByTestId("fmdEditCrateDialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Crate name")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Show gig packing checklist"),
    ).toBeInTheDocument();
  });
});
