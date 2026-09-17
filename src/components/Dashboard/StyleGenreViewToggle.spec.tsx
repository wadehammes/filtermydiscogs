import { describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { StyleGenreViewToggle } from "src/components/Dashboard/StyleGenreViewToggle.component";
import { render, screen } from "test-utils";

describe("StyleGenreViewToggle", () => {
  it("switches the style-in-genre chart view mode", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(<StyleGenreViewToggle viewMode="cumulative" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Share" }));
    expect(onChange).toHaveBeenCalledWith("share");
  });
});
