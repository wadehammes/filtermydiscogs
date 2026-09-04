import { describe, expect, it } from "@jest/globals";
import { FormDialog } from "src/components/FormDialog/FormDialog.component";
import { render, screen } from "test-utils";

describe("FormDialog", () => {
  it("renders a header, body field, and footer actions", () => {
    render(
      <FormDialog
        open
        onClose={() => {}}
        testId="fmdFormDialog"
        title="New crate"
        description="Create a crate to organize releases from your collection."
        footer={<button type="button">Cancel</button>}
      >
        <FormDialog.Field label="Crate name" htmlFor="crate-name">
          <input id="crate-name" />
        </FormDialog.Field>
      </FormDialog>,
    );

    const dialog = screen.getByTestId("fmdFormDialog");
    expect(dialog.querySelector('[class*="content"]')).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "New crate" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create a crate to organize releases from your collection.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Crate name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
