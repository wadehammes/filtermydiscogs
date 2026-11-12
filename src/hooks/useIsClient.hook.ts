"use client";

import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

const clientSnapshot = (): boolean => true;

const serverSnapshot = (): boolean => false;

export const useIsClient = (): boolean =>
  useSyncExternalStore(subscribeNoop, clientSnapshot, serverSnapshot);
