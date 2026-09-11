"use client";

import { type ReactNode, Suspense, use } from "react";
import { browser } from "react-dom";

interface BrowserOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const BrowserOnlyInner = ({ children }: { children: ReactNode }) => {
  use(browser());

  return children;
};

export const BrowserOnly = ({
  children,
  fallback = null,
}: BrowserOnlyProps) => {
  return (
    <Suspense fallback={fallback}>
      <BrowserOnlyInner>{children}</BrowserOnlyInner>
    </Suspense>
  );
};
