import { addTransitionType, startTransition } from "react";
import {
  type ViewActions,
  ViewActionTypes,
  type ViewMode,
} from "src/atoms/view.atoms";

export const dispatchViewChangeWithTransition = (
  viewDispatch: (action: ViewActions) => void,
  view: ViewMode,
) => {
  startTransition(() => {
    addTransitionType(`view-${view}`);
    viewDispatch({
      type: ViewActionTypes.SetView,
      payload: view,
    });
  });
};
