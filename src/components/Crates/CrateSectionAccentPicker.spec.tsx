import { beforeEach, describe, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { CrateSectionAccentPicker } from "src/components/Crates/CrateSectionAccentPicker.component";
import { expectPortaledPopupAttachedToBody } from "src/tests/filterControlTestHelpers";
import { render, screen } from "test-utils";

describe("CrateSectionAccentPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("portals the section color menu to document.body", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onChange = jest.fn();

    render(<CrateSectionAccentPicker value={null} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Section color" }));

    const menu = await screen.findByRole("menu", { name: "Section color" });
    expectPortaledPopupAttachedToBody(menu);
  });
});
