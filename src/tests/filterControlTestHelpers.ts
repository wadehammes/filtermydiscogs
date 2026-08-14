import { expect } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "test-utils";

export const openFilterCombobox = async (name: string) => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const trigger = screen.getByRole("combobox", { name });
  await user.click(trigger);

  await waitFor(() => {
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  await screen.findByPlaceholderText(`Search ${name.toLowerCase()}...`);

  return user;
};

export const clickFilterOption = async (label: string) => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  let option: Element | undefined;
  await waitFor(() => {
    option = screen
      .getAllByRole("option", { hidden: true })
      .find((node) => node.textContent?.includes(label));
    expect(option).toBeDefined();
  });

  await user.click(option as Element);

  return user;
};
