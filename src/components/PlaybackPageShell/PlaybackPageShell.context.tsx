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

  const setOverlayPortalElement = useCallback((element: HTMLElement | null) => {
    setOverlayPortalElementState(element);
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
    }),
    [
      scrollElement,
      lockScroll,
      unlockScroll,
      overlayPortalElement,
      setOverlayPortalElement,
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
