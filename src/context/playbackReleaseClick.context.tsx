"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

type ReleaseClickHandler = (instanceId: string) => void;

interface PlaybackReleaseClickContextValue {
  registerHandler: (handler: ReleaseClickHandler | null) => void;
  invokeHandler: ReleaseClickHandler;
}

const PlaybackReleaseClickContext = createContext<
  PlaybackReleaseClickContextValue | undefined
>(undefined);

interface PlaybackReleaseClickProviderProps {
  children: ReactNode;
}

export const PlaybackReleaseClickProvider = ({
  children,
}: PlaybackReleaseClickProviderProps) => {
  const handlerRef = useRef<ReleaseClickHandler | null>(null);

  const registerHandler = useCallback((handler: ReleaseClickHandler | null) => {
    handlerRef.current = handler;
  }, []);

  const invokeHandler = useCallback((instanceId: string) => {
    handlerRef.current?.(instanceId);
  }, []);

  const value = useMemo(
    (): PlaybackReleaseClickContextValue => ({
      registerHandler,
      invokeHandler,
    }),
    [invokeHandler, registerHandler],
  );

  return (
    <PlaybackReleaseClickContext.Provider value={value}>
      {children}
    </PlaybackReleaseClickContext.Provider>
  );
};

export const useRegisterPlaybackReleaseClick = (
  handler: ReleaseClickHandler | undefined,
) => {
  const context = useContext(PlaybackReleaseClickContext);

  if (!context) {
    throw new Error(
      "useRegisterPlaybackReleaseClick must be used within PlaybackReleaseClickProvider",
    );
  }

  useEffect(() => {
    context.registerHandler(handler ?? null);

    return () => {
      context.registerHandler(null);
    };
  }, [context, handler]);
};

export const usePlaybackReleaseClickHandler = (): ReleaseClickHandler => {
  const context = useContext(PlaybackReleaseClickContext);

  if (!context) {
    return () => undefined;
  }

  return context.invokeHandler;
};
