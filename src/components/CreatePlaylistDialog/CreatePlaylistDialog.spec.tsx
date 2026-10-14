import { beforeEach, describe, expect, it } from "@jest/globals";
import { CreatePlaylistDialogPageObject } from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.po";
import { screen } from "test-utils";

let po: CreatePlaylistDialogPageObject;

describe("CreatePlaylistDialog", () => {
  beforeEach(() => {
    po = new CreatePlaylistDialogPageObject();
  });

  it("renders CreatePlaylistDialog", () => {
    po.renderCreatePlaylistDialog();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
