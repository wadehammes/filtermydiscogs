import { expect } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "test-utils";

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
