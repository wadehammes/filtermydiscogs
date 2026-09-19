import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { getReleaseNotesTextFieldError } from "src/components/ReleaseNotes/ReleaseNotesFormFields.component";
import { ReleaseNotesFormFieldsPageObject } from "src/components/ReleaseNotes/ReleaseNotesFormFields.po";
import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import { RELEASE_NOTE_TOO_LONG_MESSAGE } from "src/lib/validation/releaseNotes.schemas";
import { discogsCollectionFieldFactory } from "src/tests/factories/DiscogsCollectionField.factory";
import { act, screen, waitFor } from "test-utils";

let po: ReleaseNotesFormFieldsPageObject;

describe("ReleaseNotesFormFields", () => {
  const notesField = discogsCollectionFieldFactory.notesField({
    id: 3,
    position: 1,
  });
  const otherNotesField = discogsCollectionFieldFactory.build({
    id: 4,
    name: "Other Notes",
    type: "textarea",
    position: 2,
  });
  const mediaConditionField =
    discogsCollectionFieldFactory.mediaConditionField();

  beforeEach(() => {
    po = new ReleaseNotesFormFieldsPageObject();
  });

  it("renders a single textarea with its field label when only one text field exists", () => {
    po.renderReleaseNotesFormFields({
      textFields: [notesField],
      defaultValues: { "3": "Signed copy" },
    });

    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue(
      "Signed copy",
    );
    expect(screen.queryByLabelText("Note Field")).not.toBeInTheDocument();
  });

  it("renders a field picker and one textarea when multiple text fields exist", async () => {
    const user = userEvent.setup();

    po.renderReleaseNotesFormFields({
      textFields: [notesField, otherNotesField],
      defaultValues: { "3": "Signed copy", "4": "Gift from a friend" },
    });

    expect(screen.getByLabelText("Note Field")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue(
      "Signed copy",
    );
    expect(
      screen.queryByRole("textbox", { name: "Other Notes" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Note Field"));
    await user.click(
      await screen.findByRole("option", { name: /Other Notes/ }),
    );

    expect(screen.getByRole("textbox", { name: "Other Notes" })).toHaveValue(
      "Gift from a friend",
    );
    expect(
      screen.queryByRole("textbox", { name: "Notes" }),
    ).not.toBeInTheDocument();
  });

  it("blurs the previous text field when switching the field picker", async () => {
    const user = userEvent.setup();
    const onTextFieldBlur = jest.fn();

    po.renderReleaseNotesFormFields({
      textFields: [notesField, otherNotesField],
      defaultValues: { "3": "", "4": "" },
      onTextFieldBlur,
    });

    await user.click(screen.getByLabelText("Note Field"));
    await user.click(
      await screen.findByRole("option", { name: /Other Notes/ }),
    );

    expect(onTextFieldBlur).toHaveBeenCalledWith(3);
  });

  it("shows stored char counts on note field picker options with text", async () => {
    const user = userEvent.setup();

    po.renderReleaseNotesFormFields({
      textFields: [notesField, otherNotesField],
      defaultValues: { "3": "Signed copy", "4": "" },
    });

    await user.click(screen.getByLabelText("Note Field"));

    await waitFor(() => {
      expect(screen.getAllByText("(11 chars)")).toHaveLength(2);
    });
  });

  it("defaults the picker to the first text field with saved content", async () => {
    po.renderReleaseNotesFormFields({
      textFields: [notesField, otherNotesField],
      defaultValues: { "3": "", "4": "Has content" },
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Other Notes" })).toHaveValue(
        "Has content",
      );
    });
  });

  it("updates react-hook-form values when typing in a textarea", async () => {
    const user = userEvent.setup();

    po.renderReleaseNotesFormFields({
      textFields: [notesField],
      defaultValues: { "3": "" },
    });

    await user.type(screen.getByRole("textbox", { name: "Notes" }), "New note");

    await waitFor(() => {
      expect(po.getFormMethods().getValues()["3"]).toBe("New note");
    });
  });

  it("shows a validation error when note text exceeds the max length", async () => {
    const overLimitValue = "x".repeat(COLLECTION_NOTE_MAX_LENGTH + 1);

    po.renderReleaseNotesFormFields({
      textFields: [notesField],
      defaultValues: { "3": "" },
    });

    await act(async () => {
      po.getFormMethods().setValue("3", overLimitValue, {
        shouldValidate: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        RELEASE_NOTE_TOO_LONG_MESSAGE,
      );
    });
  });

  it("updates condition field values through the form context", async () => {
    const user = userEvent.setup();

    po.renderReleaseNotesFormFields({
      textFields: [notesField],
      conditionFields: [mediaConditionField],
      defaultValues: { "3": "", "1": "" },
    });

    await user.click(screen.getByLabelText("Media Condition"));
    await user.click(
      await screen.findByRole("option", { name: "Very Good Plus (VG+)" }),
    );

    await waitFor(() => {
      expect(po.getFormMethods().getValues()["1"]).toBe("Very Good Plus (VG+)");
    });
  });

  it("shows inline save status beside the character count", () => {
    po.renderReleaseNotesFormFields({
      textFields: [notesField],
      defaultValues: { "3": "Saved text" },
      textFieldSaveStatus: { "3": "saved" },
    });

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("10 / 10000")).toBeInTheDocument();
  });

  it("calls a custom text field change handler instead of the default setValue path", async () => {
    const user = userEvent.setup();
    const onTextFieldChange = jest.fn();

    po.renderReleaseNotesFormFields({
      textFields: [notesField],
      defaultValues: { "3": "" },
      onTextFieldChange,
    });

    await user.type(screen.getByRole("textbox", { name: "Notes" }), "a");

    expect(onTextFieldChange).toHaveBeenCalled();
    expect(po.getFormMethods().getValues()["3"]).toBe("");
  });
});

describe("getReleaseNotesTextFieldError", () => {
  it("returns string field errors from react-hook-form error objects", () => {
    expect(
      getReleaseNotesTextFieldError({ "3": { message: "Too long" } }, "3"),
    ).toEqual({ message: "Too long" });
  });

  it("ignores non-string field error messages", () => {
    expect(
      getReleaseNotesTextFieldError({ "3": { message: 404 } }, "3"),
    ).toBeUndefined();
  });
});
