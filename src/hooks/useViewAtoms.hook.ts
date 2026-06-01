"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  currentViewAtom,
  previousViewAtom,
  type ViewActions,
  viewDispatchAtom,
} from "src/atoms/view.atoms";
import { useViewScope } from "src/context/view.context";

export const useViewDispatch = () => {
  useViewScope();

  return useSetAtom(viewDispatchAtom) as React.Dispatch<ViewActions>;
};

export const useCurrentView = () => {
  useViewScope();

  return useAtomValue(currentViewAtom);
};

export const usePreviousView = () => {
  useViewScope();

  return useAtomValue(previousViewAtom);
};
