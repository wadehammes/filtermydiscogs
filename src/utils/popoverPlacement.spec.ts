import {
  estimateSelectMenuHeight,
  shouldOpenPopoverUpward,
} from "./popoverPlacement";

describe("shouldOpenPopoverUpward", () => {
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
    });
    document.body.innerHTML = "";
  });

  it("opens upward when the drawer footer leaves insufficient space below", () => {
    document.body.innerHTML = `
      <div data-testid="fmdBottomDrawer">
        <div data-bottom-drawer-footer></div>
      </div>
    `;

    const footer = document.querySelector("[data-bottom-drawer-footer]");
    if (footer instanceof HTMLElement) {
      footer.getBoundingClientRect = () =>
        ({
          top: 700,
          bottom: 780,
          left: 0,
          right: 0,
          width: 0,
          height: 80,
          x: 0,
          y: 700,
          toJSON: () => ({}),
        }) as DOMRect;
    }

    const trigger = document.createElement("button");
    trigger.getBoundingClientRect = () =>
      ({
        top: 640,
        bottom: 684,
        left: 0,
        right: 0,
        width: 0,
        height: 44,
        x: 0,
        y: 640,
        toJSON: () => ({}),
      }) as DOMRect;

    document
      .querySelector('[data-testid="fmdBottomDrawer"]')
      ?.appendChild(trigger);

    expect(
      shouldOpenPopoverUpward({
        trigger,
        estimatedMenuHeight: 220,
      }),
    ).toBe(true);
  });

  it("opens downward when there is enough space above the drawer footer", () => {
    document.body.innerHTML = `
      <div data-testid="fmdBottomDrawer">
        <div data-bottom-drawer-footer></div>
      </div>
    `;

    const footer = document.querySelector("[data-bottom-drawer-footer]");
    if (footer instanceof HTMLElement) {
      footer.getBoundingClientRect = () =>
        ({
          top: 790,
          bottom: 870,
          left: 0,
          right: 0,
          width: 0,
          height: 80,
          x: 0,
          y: 760,
          toJSON: () => ({}),
        }) as DOMRect;
    }

    const trigger = document.createElement("button");
    trigger.getBoundingClientRect = () =>
      ({
        top: 600,
        bottom: 644,
        left: 0,
        right: 0,
        width: 0,
        height: 44,
        x: 0,
        y: 600,
        toJSON: () => ({}),
      }) as DOMRect;

    document
      .querySelector('[data-testid="fmdBottomDrawer"]')
      ?.appendChild(trigger);

    expect(
      shouldOpenPopoverUpward({
        trigger,
        estimatedMenuHeight: 132,
      }),
    ).toBe(false);
  });

  it("opens downward for long lists when capped height fits below the footer", () => {
    document.body.innerHTML = `
      <div data-testid="fmdBottomDrawer">
        <div data-bottom-drawer-footer></div>
      </div>
    `;

    const footer = document.querySelector("[data-bottom-drawer-footer]");
    if (footer instanceof HTMLElement) {
      footer.getBoundingClientRect = () =>
        ({
          top: 790,
          bottom: 870,
          left: 0,
          right: 0,
          width: 0,
          height: 80,
          x: 0,
          y: 760,
          toJSON: () => ({}),
        }) as DOMRect;
    }

    const trigger = document.createElement("button");
    trigger.getBoundingClientRect = () =>
      ({
        top: 300,
        bottom: 344,
        left: 0,
        right: 0,
        width: 0,
        height: 44,
        x: 0,
        y: 300,
        toJSON: () => ({}),
      }) as DOMRect;

    document
      .querySelector('[data-testid="fmdBottomDrawer"]')
      ?.appendChild(trigger);

    const estimatedMenuHeight = estimateSelectMenuHeight(120);

    expect(estimatedMenuHeight).toBe(300);
    expect(
      shouldOpenPopoverUpward({
        trigger,
        estimatedMenuHeight,
      }),
    ).toBe(false);
  });
});
