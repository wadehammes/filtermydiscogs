import { expect } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "test-utils";

const getFilterComboboxTrigger = (name: string) =>
  screen.getByRole("combobox", { name });

export const openFilterCombobox = async (name: string) => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const trigger = getFilterComboboxTrigger(name);
  const clickTarget = trigger.querySelector("svg")?.parentElement ?? trigger;
  await user.click(clickTarget);

  await waitFor(() => {
    expect(getFilterComboboxTrigger(name)).toHaveAttribute(
      "aria-expanded",
      "true",
    );
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

  await user.keyboard("{Escape}");

  await waitFor(() => {
    const openComboboxes = screen
      .getAllByRole("combobox")
      .filter((node) => node.getAttribute("aria-expanded") === "true");
    expect(openComboboxes).toHaveLength(0);
  });

  return user;
};
