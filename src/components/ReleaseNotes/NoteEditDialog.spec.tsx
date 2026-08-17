import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { NoteEditDialog } from "src/components/ReleaseNotes/NoteEditDialog.component";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { render, screen, waitFor } from "test-utils";

describe("NoteEditDialog", () => {
  const fields =
    discogsCollectionFieldsResponseFactory.forReleaseNotes().fields;

  it("renders media and sleeve condition selects below the notes textarea", async () => {
    const release = releaseFactory.forNotesEditor(12345, {
      notes: [
        { field_id: 1, value: "Near Mint (NM or M-)" },
        { field_id: 3, value: "Signed copy" },
      ],
    });

    render(
      <NoteEditDialog
        isOpen
        release={release}
        fields={fields}
        isSaving={false}
        onClose={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: "Notes" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Media Condition")).toBeInTheDocument();
    expect(screen.getByLabelText("Sleeve Condition")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Signed copy")).toBeInTheDocument();
    expect(screen.getByText("Near Mint (NM or M-)")).toBeInTheDocument();
  });

  it("includes changed condition values in save payload", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    const release = releaseFactory.forNotesEditor(12345, { notes: [] });

    render(
      <NoteEditDialog
        isOpen
        release={release}
        fields={fields}
        isSaving={false}
        onClose={jest.fn()}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByLabelText("Media Condition"));
    await user.click(
      await screen.findByRole("option", { name: "Very Good Plus (VG+)" }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith([
      { fieldId: 1, value: "Very Good Plus (VG+)" },
    ]);
  });
});
