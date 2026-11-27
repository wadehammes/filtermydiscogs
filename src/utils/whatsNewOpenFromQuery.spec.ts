import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  WHATS_NEW_OPEN_QUERY_PARAM,
  WHATS_NEW_OPEN_QUERY_VALUE,
} from "src/constants/whatsNew.constants";
import { setWindowLocation } from "src/tests/mocks/mockWindowLocation";
import {
  buildUrlWithWhatsNewOpenQuery,
  handleWhatsNewOpenFromQuery,
  navigateToSamePageWithWhatsNewQuery,
} from "src/utils/whatsNewOpenFromQuery";

describe("buildUrlWithWhatsNewOpenQuery", () => {
  it("appends the whatsnew query flag to an existing URL", () => {
    expect(
      buildUrlWithWhatsNewOpenQuery(
        "http://localhost/collection?sort=artist#filters",
      ),
    ).toBe(
      `http://localhost/collection?sort=artist&${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}#filters`,
    );
  });
});

describe("navigateToSamePageWithWhatsNewQuery", () => {
  it("replaces the location with the whatsnew query flag", () => {
    setWindowLocation("http://localhost/collection");
    const replaceSpy = jest
      .spyOn(window.location, "replace")
      .mockImplementation(() => {});

    navigateToSamePageWithWhatsNewQuery();

    expect(replaceSpy).toHaveBeenCalledWith(
      `http://localhost/collection?${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}`,
    );

    replaceSpy.mockRestore();
  });
});

describe("handleWhatsNewOpenFromQuery", () => {
  let onOpen: jest.Mock;

  beforeEach(() => {
    onOpen = jest.fn();
    setWindowLocation("http://localhost/collection");
  });

  afterEach(() => {
    onOpen.mockClear();
  });

  it("when authenticated but user id is not ready, does not open or strip the param", () => {
    setWindowLocation(
      `http://localhost/collection?${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}`,
    );
    const handledRef = { current: false };

    handleWhatsNewOpenFromQuery(handledRef, {
      userId: null,
      authResolved: true,
      isAuthenticated: true,
      hasUnseenWhatsNew: true,
      onOpen,
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(handledRef.current).toBe(false);
    expect(window.location.search).toBe(
      `?${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}`,
    );
  });

  it("when auth is not resolved yet, does not open or strip the param", () => {
    setWindowLocation(
      `http://localhost/collection?${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}`,
    );
    const handledRef = { current: false };

    handleWhatsNewOpenFromQuery(handledRef, {
      userId: null,
      authResolved: false,
      isAuthenticated: false,
      hasUnseenWhatsNew: true,
      onOpen,
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(handledRef.current).toBe(false);
    expect(window.location.search).toBe(
      `?${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}`,
    );
  });

  it("when the user has unseen releases, opens the modal and strips the param", () => {
    setWindowLocation(
      `http://localhost/collection?${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}`,
    );
    const handledRef = { current: false };

    handleWhatsNewOpenFromQuery(handledRef, {
      userId: "user-1",
      authResolved: true,
      isAuthenticated: true,
      hasUnseenWhatsNew: true,
      onOpen,
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(handledRef.current).toBe(true);
    expect(window.location.search).toBe("");
  });

  it("when the user already saw the latest release, strips the param without opening", () => {
    setWindowLocation(
      `http://localhost/collection?${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}`,
    );
    const handledRef = { current: false };

    handleWhatsNewOpenFromQuery(handledRef, {
      userId: "user-1",
      authResolved: true,
      isAuthenticated: true,
      hasUnseenWhatsNew: false,
      onOpen,
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(handledRef.current).toBe(true);
    expect(window.location.search).toBe("");
  });

  it("when signed out after auth resolves, strips the param without opening", () => {
    setWindowLocation(
      `http://localhost/?${WHATS_NEW_OPEN_QUERY_PARAM}=${WHATS_NEW_OPEN_QUERY_VALUE}`,
    );
    const handledRef = { current: false };

    handleWhatsNewOpenFromQuery(handledRef, {
      userId: null,
      authResolved: true,
      isAuthenticated: false,
      hasUnseenWhatsNew: true,
      onOpen,
    });

    expect(onOpen).not.toHaveBeenCalled();
    expect(handledRef.current).toBe(true);
    expect(window.location.search).toBe("");
  });
});
