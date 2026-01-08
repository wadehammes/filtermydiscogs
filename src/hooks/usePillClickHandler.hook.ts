import { useCallback } from "react";
import { trackEvent } from "src/analytics/analytics";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";

interface UsePillClickHandlerOptions {
  category: string;
  onExitRandomMode?: (() => void) | undefined;
}

interface PillClickParams {
  event: React.MouseEvent;
  value: string;
  type: "style" | "format";
  eventLabel: string;
}

/**
 * Hook that provides a handler for style/format pill clicks
 * @param options - Configuration options
 * @param options.category - Analytics category (e.g., "releaseCard", "releasesTable")
 * @param options.onExitRandomMode - Optional callback to exit random mode
 * @returns A handler function for pill clicks
 */
export const usePillClickHandler = ({
  category,
  onExitRandomMode,
}: UsePillClickHandlerOptions) => {
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();

  const handlePillClick = useCallback(
    ({ event, value, type, eventLabel }: PillClickParams) => {
      event.preventDefault();
      event.stopPropagation();

      trackEvent(`${type}PillClicked`, {
        action: `${type}PillClicked`,
        category,
        label: eventLabel,
        value,
      });

      if (filtersState.isRandomMode) {
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
    [category, filtersDispatch, filtersState.isRandomMode, onExitRandomMode],
  );

  return handlePillClick;
};
