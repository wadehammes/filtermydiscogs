import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import type { RenderResult } from "src/tests/utils/test-utils";
import { render } from "src/tests/utils/test-utils";
import { BackToTop } from "./BackToTop.component";

export class BackToTopPageObject extends BasePageObject {
  public testId = "fmdBackToTop";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.resetScroll();
  }

  resetScroll(scrollY = 0, scrollTop = 0) {
    window.scrollTo = jest.fn();
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: scrollY,
    });
    Object.defineProperty(document.documentElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: scrollTop,
    });
  }

  setScrollY(scrollY: number) {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: scrollY,
    });
  }

  mockScrollTo() {
    const scrollToSpy = jest.fn();
    window.scrollTo = scrollToSpy;
    return scrollToSpy;
  }

  renderBackToTop(): RenderResult {
    return render(<BackToTop />);
  }
}
