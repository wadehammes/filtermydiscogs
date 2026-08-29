import { beforeEach, describe, expect, it } from "@jest/globals";
import { SaveFilterViewDialogPageObject } from "src/components/SaveFilterViewDialog/SaveFilterViewDialog.po";
import { screen } from "test-utils";

let po: SaveFilterViewDialogPageObject;

describe("SaveFilterViewDialog", () => {
  beforeEach(() => {
    po = new SaveFilterViewDialogPageObject();
  });

  it("renders SaveFilterViewDialog", () => {
    po.renderSaveFilterViewDialog();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders rename mode with the current name prefilled", () => {
    po.renderSaveFilterViewDialog({
      mode: "rename",
      initialName: "Techno",
    });

    expect(
      screen.getByRole("heading", { name: "Rename view" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("View name")).toHaveValue("Techno");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
