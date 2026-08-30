import { useCallback } from "react";
import { FiltersActionTypes } from "src/context/filters.context";
import {
  useFiltersDispatch,
  useIsRandomMode,
} from "src/hooks/useFilterAtoms.hook";

interface UsePillClickHandlerOptions {
  onExitRandomMode?: (() => void) | undefined;
}

interface PillClickParams {
  event: React.MouseEvent;
  value: string;
  type: "style" | "format";
}

export const usePillClickHandler = ({
  onExitRandomMode,
}: UsePillClickHandlerOptions = {}) => {
  const filtersDispatch = useFiltersDispatch();
  const isRandomMode = useIsRandomMode();

  const handlePillClick = useCallback(
    ({ event, value, type }: PillClickParams) => {
      event.preventDefault();
      event.stopPropagation();

      if (isRandomMode) {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
        onExitRandomMode?.();
      }

      filtersDispatch({
        type:
          type === "style"
            ? FiltersActionTypes.ToggleStyle
            : FiltersActionTypes.ToggleFormat,
        payload: value,
      });
    },
    [filtersDispatch, isRandomMode, onExitRandomMode],
  );

  return handlePillClick;
};
