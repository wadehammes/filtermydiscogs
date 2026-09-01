import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  navigateToPathHash,
  scrollToHash,
  scrollToPathHash,
  splitPathHashHref,
} from "./hashNavigation";

describe("hashNavigation", () => {
  let scrollIntoView: jest.Mock;
  let replaceState: jest.Mock;

  beforeEach(() => {
    scrollIntoView = jest.fn();
    replaceState = jest.fn();
    window.history.replaceState = replaceState;

    document.body.innerHTML = `<section id="support"></section>`;
    const section = document.getElementById("support");

    if (section) {
      section.scrollIntoView = scrollIntoView;
    }
  });

  it("parses pathname, search, and hash from an href", () => {
    expect(splitPathHashHref("/about?donated=1#support")).toEqual({
      pathname: "/about",
      search: "?donated=1",
      hash: "#support",
      href: "/about?donated=1#support",
    });
  });

  it("scrolls to a hash target element", () => {
    scrollToHash({ hash: "support" });

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("scrolls to a hash target and updates the url", () => {
    scrollToPathHash({
      pathname: "/about",
      hash: "support",
      search: "?donated=1",
    });

    expect(scrollIntoView).toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/about?donated=1#support",
    );
  });

  it("scrolls in place when already on the target pathname", () => {
    const router = { push: jest.fn() };
    const preventDefault = jest.fn();

    navigateToPathHash({
      href: "/about#support",
      currentPathname: "/about",
      router,
      event: { defaultPrevented: false, preventDefault },
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("navigates to the target href from other routes", () => {
    const router = { push: jest.fn() };

    navigateToPathHash({
      href: "/about#support",
      currentPathname: "/releases",
      router,
    });

    expect(router.push).toHaveBeenCalledWith("/about#support");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
