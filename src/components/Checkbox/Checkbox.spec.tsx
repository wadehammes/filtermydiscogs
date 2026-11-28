import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "src/components/Checkbox/Checkbox.component";
import { render, screen } from "test-utils";

describe("Checkbox", () => {
  const onCheckedChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when clicked, calls onCheckedChange and exposes a checkbox role", async () => {
    const user = userEvent.setup();

    render(
      <label htmlFor="accept-terms-checkbox">
        <Checkbox
          id="accept-terms-checkbox"
          checked={false}
          onCheckedChange={onCheckedChange}
        />
        Accept terms
      </label>,
    );

    const control = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(control).not.toBeChecked();

    await user.click(control);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
