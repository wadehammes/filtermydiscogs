import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { ReleaseTracklistAddAllMenuPageObject } from "src/components/ReleaseTracklistAddAllMenu/ReleaseTracklistAddAllMenu.po";
import { screen, waitFor } from "test-utils";

let po: ReleaseTracklistAddAllMenuPageObject;

describe("ReleaseTracklistAddAllMenu", () => {
  beforeEach(() => {
    po = new ReleaseTracklistAddAllMenuPageObject();
  });

  it("opens the add-all menu and runs onAddAllToQueue from Queue", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onAddAllToQueue = jest.fn();

    po.renderReleaseTracklistAddAllMenu({ onAddAllToQueue });

    await user.click(screen.getByTestId(po.triggerTestId));
    await waitFor(() => {
      expect(screen.getByTestId(po.panelTestId)).toBeInTheDocument();
    });
    await user.click(screen.getByRole("menuitem", { name: "Queue" }));

    expect(onAddAllToQueue).toHaveBeenCalledTimes(1);
  });
});
