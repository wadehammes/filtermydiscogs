import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { MosaicExportMenuDrilldownPanelPageObject } from "src/components/MosaicExportMenu/MosaicExportMenuDrilldownPanel.po";
import { screen, waitFor } from "test-utils";

let po: MosaicExportMenuDrilldownPanelPageObject;

describe("MosaicExportMenuDrilldownPanel", () => {
  beforeEach(() => {
    po = new MosaicExportMenuDrilldownPanelPageObject();
  });

  it("when JPEG is selected, shows the aspect page with a Back row", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    po.renderMosaicExportDrilldownPanel();

    expect(screen.getByText("Choose format")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /^JPEG$/ }));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Back" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Square")).toBeInTheDocument();
  });

  it("when Back is pressed on the aspect page, returns to format choices", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    po.renderMosaicExportDrilldownPanel();

    await user.click(screen.getByRole("menuitem", { name: /^JPEG$/ }));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Back" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("menuitem", { name: "Back" }));

    await waitFor(() => {
      expect(screen.getByText("Choose format")).toBeInTheDocument();
    });
    expect(screen.getByRole("menuitem", { name: /^PNG$/ })).toBeInTheDocument();
  });
});
