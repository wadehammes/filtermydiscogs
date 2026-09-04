import { expect } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "test-utils";

const getFilterComboboxTrigger = (name: string) =>
  screen.getByRole("combobox", { name });

export const FILTER_DRAWER_POPOVER_Z_INDEX =
  "calc(var(--z-10-bottom-drawer) + 1)";

export const FILTER_BAR_POPOVER_Z_INDEX = "calc(var(--z-9-playback-dock) + 1)";

const getEffectiveZIndex = (element: HTMLElement): string => {
  if (element.style.zIndex) {
    return element.style.zIndex;
  }

  const computed = window.getComputedStyle(element).zIndex;
  return computed === "auto" ? "" : computed;
};

export const expectFilterPopupAbovePlaybackDock = (popupNode: Element) => {
  const escapedPortal = popupNode.closest("[data-overlay-stack-escape]");
  if (escapedPortal instanceof HTMLElement) {
    const zIndex = getEffectiveZIndex(escapedPortal);
    expect([
      FILTER_BAR_POPOVER_Z_INDEX,
      FILTER_DRAWER_POPOVER_Z_INDEX,
    ]).toContain(zIndex);
    return;
  }

  let node: Element | null = popupNode;

  while (node && node !== document.body) {
    if (node instanceof HTMLElement) {
      const zIndex = getEffectiveZIndex(node);
      if (
        zIndex === FILTER_BAR_POPOVER_Z_INDEX ||
        zIndex === FILTER_DRAWER_POPOVER_Z_INDEX
      ) {
        return;
      }
    }

    node = node.parentElement;
  }

  throw new Error(
    `Expected popup z-index ${FILTER_BAR_POPOVER_Z_INDEX} or ${FILTER_DRAWER_POPOVER_Z_INDEX}`,
  );
};

export const expectFilterPopupAboveBottomDrawer = (popupNode: Element) => {
  const escapedPortal = popupNode.closest("[data-overlay-stack-escape]");
  expect(escapedPortal).toBeInTheDocument();
  expect(getEffectiveZIndex(escapedPortal as HTMLElement)).toBe(
    FILTER_DRAWER_POPOVER_Z_INDEX,
  );
  expect(document.body.contains(escapedPortal)).toBe(true);
};

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

export const openFilterSelect = async (name: string) => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.click(screen.getByRole("combobox", { name }));
  await screen.findByRole("listbox", { name });
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
