"use client";

import classNames from "classnames";
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useMounted } from "src/hooks/useMounted.hook";
import { definedProps } from "src/utils/definedProps";
import styles from "./OverlayStack.module.css";

interface OverlayStackContextValue {
  portalElement: HTMLElement | null;
  popoverZIndex?: string;
}

const OverlayStackContext = createContext<OverlayStackContextValue>({
  portalElement: null,
});

export const useOverlayStack = (): OverlayStackContextValue =>
  useContext(OverlayStackContext);

export const useOverlayStackPortal = (): HTMLElement | null =>
  useContext(OverlayStackContext).portalElement;

export const usePortaledOverlayContainer = (): HTMLElement | undefined => {
  const portalElement = useOverlayStackPortal();
  return portalElement ?? undefined;
};

export const useOverlayStackPositionerStyle = (): CSSProperties => {
  const { popoverZIndex } = useOverlayStack();
  return popoverZIndex ? { zIndex: popoverZIndex } : {};
};

interface OverlayStackProps {
  children: ReactNode;
  className?: string;
  popoverZIndex?: string;
  escapeStackingContext?: boolean;
}

export const OverlayStack = ({
  children,
  className,
  popoverZIndex,
  escapeStackingContext = false,
}: OverlayStackProps) => {
  const portalRef = useRef<HTMLDivElement>(null);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const mounted = useMounted();

  useLayoutEffect(() => {
    setPortalElement(portalRef.current);
  }, [escapeStackingContext, mounted]);

  const stackStyle = useMemo(
    () =>
      popoverZIndex && !escapeStackingContext
        ? ({
            "--overlay-stack-popover-z": popoverZIndex,
          } as CSSProperties)
        : undefined,
    [popoverZIndex, escapeStackingContext],
  );

  const bodyPortalStyle = useMemo(
    () =>
      popoverZIndex && escapeStackingContext
        ? ({
            "--overlay-stack-popover-z": popoverZIndex,
            zIndex: popoverZIndex,
          } as CSSProperties)
        : undefined,
    [popoverZIndex, escapeStackingContext],
  );

  const value = useMemo(
    () =>
      definedProps({
        portalElement,
        popoverZIndex,
      }),
    [portalElement, popoverZIndex],
  );

  const bodyPortal =
    escapeStackingContext && mounted
      ? createPortal(
          <div
            ref={portalRef}
            className={styles.bodyPortal}
            data-overlay-stack-escape
            data-overlay-stack-portal
            style={bodyPortalStyle}
          />,
          document.body,
        )
      : null;

  return (
    <OverlayStackContext.Provider value={value}>
      <div
        className={classNames(styles.stackRoot, className)}
        {...(escapeStackingContext
          ? {}
          : {
              "data-overlay-stack-portal": true,
              ref: portalRef,
              style: stackStyle,
            })}
      >
        {children}
      </div>
      {bodyPortal}
    </OverlayStackContext.Provider>
  );
};
