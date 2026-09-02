"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  applyPlaybackPageScrollLock,
  lockPlaybackPageScrollElement,
  restorePlaybackPageScrollElement,
} from "./playbackPageScrollLock";

interface PlaybackPageShellContextValue {
  scrollElement: HTMLElement | null;
  scrollLockCountRef: RefObject<number>;
  lockScroll: () => void;
  unlockScroll: () => void;
  overlayPortalElement: HTMLElement | null;
  setOverlayPortalElement: (element: HTMLElement | null) => void;
  registerScrollToTop: (handler: (() => void) | null) => void;
  scrollToTop: () => void;
}

const noop = () => {};

const defaultScrollLockCountRef: RefObject<number> = { current: 0 };

const defaultContextValue: PlaybackPageShellContextValue = {
  scrollElement: null,
  scrollLockCountRef: defaultScrollLockCountRef,
  lockScroll: noop,
  unlockScroll: noop,
  overlayPortalElement: null,
  setOverlayPortalElement: noop,
  registerScrollToTop: noop,
  scrollToTop: noop,
};

const PlaybackPageShellContext =
  createContext<PlaybackPageShellContextValue>(defaultContextValue);

interface PlaybackPageShellProviderProps {
  scrollElement: HTMLElement | null;
  children: ReactNode;
}

export const PlaybackPageShellProvider = ({
  scrollElement,
  children,
}: PlaybackPageShellProviderProps) => {
  const scrollElementRef = useRef(scrollElement);
  const previousScrollElementRef = useRef<HTMLElement | null>(scrollElement);
  scrollElementRef.current = scrollElement;

  const lockCountRef = useRef(0);
  const snapshotRef = useRef<ReturnType<
    typeof lockPlaybackPageScrollElement
  > | null>(null);
  const [overlayPortalElement, setOverlayPortalElementState] =
    useState<HTMLElement | null>(null);
  const scrollToTopHandlerRef = useRef<(() => void) | null>(null);

  const setOverlayPortalElement = useCallback((element: HTMLElement | null) => {
    setOverlayPortalElementState(element);
  }, []);

  const registerScrollToTop = useCallback((handler: (() => void) | null) => {
    scrollToTopHandlerRef.current = handler;
  }, []);

  const scrollToTop = useCallback(() => {
    const handler = scrollToTopHandlerRef.current;

    if (handler) {
      handler();
      return;
    }

    const element = scrollElementRef.current;

    if (element) {
      element.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const applyLock = useCallback(() => {
    const element = scrollElementRef.current;

    if (!element || snapshotRef.current) {
      return;
    }

    snapshotRef.current = lockPlaybackPageScrollElement(element);
    applyPlaybackPageScrollLock(element);
  }, []);

  const releaseLock = useCallback(() => {
    const element = scrollElementRef.current;
    const snapshot = snapshotRef.current;

    if (!(element && snapshot)) {
      return;
    }

    restorePlaybackPageScrollElement(element, snapshot);
    snapshotRef.current = null;
  }, []);

  const lockScroll = useCallback(() => {
    lockCountRef.current += 1;

    if (lockCountRef.current === 1) {
      applyLock();
    }
  }, [applyLock]);

  const unlockScroll = useCallback(() => {
    if (lockCountRef.current === 0) {
      return;
    }

    lockCountRef.current -= 1;

    if (lockCountRef.current === 0) {
      releaseLock();
    }
  }, [releaseLock]);

  useLayoutEffect(() => {
    const previousElement = previousScrollElementRef.current;
    previousScrollElementRef.current = scrollElement;

    if (lockCountRef.current === 0 || previousElement === scrollElement) {
      return;
    }

    if (previousElement && snapshotRef.current) {
      restorePlaybackPageScrollElement(previousElement, snapshotRef.current);
      snapshotRef.current = null;
    }

    applyLock();
  }, [scrollElement, applyLock]);

  const value = useMemo(
    () => ({
      scrollElement,
      scrollLockCountRef: lockCountRef,
      lockScroll,
      unlockScroll,
      overlayPortalElement,
      setOverlayPortalElement,
      registerScrollToTop,
      scrollToTop,
    }),
    [
      scrollElement,
      lockScroll,
      unlockScroll,
      overlayPortalElement,
      setOverlayPortalElement,
      registerScrollToTop,
      scrollToTop,
    ],
  );

  return (
    <PlaybackPageShellContext.Provider value={value}>
      {children}
    </PlaybackPageShellContext.Provider>
  );
};

export const usePlaybackPageScrollElement = (): HTMLElement | null =>
  useContext(PlaybackPageShellContext).scrollElement;

export const usePlaybackPageScrollLockCountRef = (): RefObject<number> =>
  useContext(PlaybackPageShellContext).scrollLockCountRef;

export const usePlaybackPageOverlayPortal = (): HTMLElement | null =>
  useContext(PlaybackPageShellContext).overlayPortalElement;

export const usePlaybackPageShellMountSetters = () => {
  const { setOverlayPortalElement } = useContext(PlaybackPageShellContext);

  return { setOverlayPortalElement };
};

export const usePlaybackPageScrollToTop = (): (() => void) =>
  useContext(PlaybackPageShellContext).scrollToTop;

export const usePlaybackPageScrollToTopRegistration = (): ((
  handler: (() => void) | null,
) => void) => useContext(PlaybackPageShellContext).registerScrollToTop;

export const usePlaybackPageScrollLock = (enabled: boolean): void => {
  const { lockScroll, unlockScroll } = useContext(PlaybackPageShellContext);

  useLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }

    lockScroll();

    return unlockScroll;
  }, [enabled, lockScroll, unlockScroll]);
};
