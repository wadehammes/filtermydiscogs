import { beforeEach, describe, expect, it } from "@jest/globals";
import { ReleasePlaylistPickerDialogPageObject } from "src/components/ReleasePlaylistPickerDialog/ReleasePlaylistPickerDialog.po";
import { screen } from "test-utils";

let po: ReleasePlaylistPickerDialogPageObject;

describe("ReleasePlaylistPickerSubmenu", () => {
  beforeEach(() => {
    po = new ReleasePlaylistPickerDialogPageObject();
  });

  it("renders playlist picker submenu panel", () => {
    po.renderReleasePlaylistPickerSubmenu();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
