// eslint-disable testing-library/no-node-access
import {
  type BoundFunctions,
  type Queries,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export interface BasePageObjectProps {
  debug?: boolean;
  raiseOnFind?: boolean;
}

export interface SignUpPageObjectProps extends BasePageObjectProps {
  preventMockReset?: boolean;
}

export class BasePageObject {
  private readonly debug: boolean;
  private readonly raiseOnFind: boolean;

  constructor(
    { debug, raiseOnFind }: BasePageObjectProps = {
      debug: false,
      raiseOnFind: false,
    },
  ) {
    this.debug = Boolean(debug);
    this.raiseOnFind = Boolean(raiseOnFind);
  }

  findByRole<T = HTMLElement>(role: string, name?: string): T {
    this.debugLog(
      `trying to find an element with ${role} that has the text "${name}"`,
    );

    return screen.getByRole(role, name ? { name } : undefined) as unknown as T;
  }

  findAllByRole<T = HTMLElement>(role: string, name?: string): T[] {
    this.debugLog(
      `trying to find all elements with ${role} that has the text "${name}"`,
    );

    return screen.getAllByRole(
      role,
      name ? { name } : undefined,
    ) as unknown as T[];
  }

  findButtons(name: string): HTMLButtonElement[] {
    this.debugLog(`trying to find a button with text "${name}"`);

    return screen.getAllByRole("button", { name }) as HTMLButtonElement[];
  }

  findButton(
    name: string | RegExp,
    opts: { exact?: boolean } = {},
  ): HTMLButtonElement {
    this.debugLog(`trying to find a button with text "${name}"`);

    return screen.queryByRole("button", { name, ...opts }) as HTMLButtonElement;
  }

  findLink(
    name: string | RegExp,
    opts: { exact?: boolean } = {},
  ): HTMLLinkElement {
    this.debugLog(`trying to find a link with text "${name}"`);

    return screen.queryByRole("link", { name, ...opts }) as HTMLLinkElement;
  }

  clickButton(button: HTMLButtonElement) {
    if (!button) {
      throw new Error("Unable to find the button you want me to click.");
    }
    if (button.disabled) {
      throw new Error("The button to click appears to be disabled.");
    }
    userEvent.click(button);
  }

  clickElement(element: HTMLInputElement | HTMLElement) {
    userEvent.click(element);
    userEvent.tab();
  }

  findTestId(id: string): HTMLElement {
    this.debugLog(`trying to find an element with data-testid "${id}"`);

    return screen.queryByTestId(id) as HTMLElement;
  }

  findAllTestIds(id: string): HTMLElement[] {
    this.debugLog(`trying to find all elements with data-testid "${id}"`);

    return screen.getAllByTestId(id) as HTMLElement[];
  }

  find(
    txt: string | RegExp,
    opts: { exact?: boolean } = {},
  ): HTMLElement | null {
    this.debugLog(`trying to find "${txt}"`);
    try {
      return screen.getByText(txt, opts);
    } catch (ex) {
      if (this.raiseOnFind) {
        throw ex;
      }

      // Returning null is more consistent with the expected behavior of testing-library queries.
      // This enables us to use `expect().not.toBeInTheDocument()` instead of `expect().toBeUndefined()`.
      return null;
    }
  }

  findAll(txt: string | RegExp, opts: { exact?: boolean } = {}): HTMLElement[] {
    this.debugLog(`trying to findAll "${txt}"`);

    return screen.getAllByText(txt, opts) as HTMLElement[];
  }

  findInput(label: string | RegExp): HTMLInputElement {
    return screen.getByLabelText(label) as HTMLInputElement;
  }

  findTab(name: string): HTMLElement {
    return screen.queryByRole("tab", { name }) as HTMLElement;
  }

  findAllTabs(name: string): HTMLElement[] {
    return screen.queryAllByRole("tab", { name }) as HTMLElement[];
  }

  /**
   * Finds a heading in the virtual testing screen with the given text.
   * @memberof BasePageObject
   */
  public findHeadingWithText(text: string, level?: number): HTMLElement | null {
    this.debugLog(`trying to find a heading with text "${text}"`);
    try {
      return screen.getByRole("heading", { name: text, level: level || 1 });
    } catch (err) {
      if (this.raiseOnFind) {
        throw err;
      }
      return null;
    }
  }

  selectOption(selectField: HTMLElement, value: string) {
    userEvent.type(selectField, value);
  }

  get spinner() {
    return screen.queryByRole("progressbar");
  }

  within(
    element: HTMLElement,
    cb: (subsection: BoundFunctions<Queries>) => void,
  ) {
    return cb(within(element));
  }

  private debugLog(msg: string) {
    if (this.debug) {
      // eslint-disable-next-line no-console -- jest console debugging
      console.debug(msg);
    }
  }
}
