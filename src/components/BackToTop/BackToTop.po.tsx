import { PlaybackPageShellProvider } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { BackToTop } from "./BackToTop.component";

export class BackToTopPageObject extends BasePageObject {
  public testId = "fmdBackToTop";
  public scrollElement = document.createElement("div");

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
    Object.defineProperty(this.scrollElement, "scrollTop", {
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
    Object.defineProperty(this.scrollElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: scrollY,
    });
  }

  mockScrollTo() {
    const scrollToSpy = jest.fn();
    this.scrollElement.scrollTo = scrollToSpy;
    window.scrollTo = scrollToSpy;
    return scrollToSpy;
  }

  renderBackToTop(): RenderResult {
    return render(
      <PlaybackPageShellProvider scrollElement={this.scrollElement}>
        <BackToTop />
      </PlaybackPageShellProvider>,
    );
  }
}
