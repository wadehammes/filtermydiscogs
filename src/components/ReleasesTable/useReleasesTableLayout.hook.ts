import type { ColumnSizingState, OnChangeFn } from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { RELEASES_TABLE_LAYOUT_STORAGE_KEY } from "src/constants/storageKeys";

type ReleasesTableLayoutState = {
  columnSizing: ColumnSizingState;
};

const DEFAULT_LAYOUT: ReleasesTableLayoutState = {
  columnSizing: {},
};

const readLayout = (): ReleasesTableLayoutState => {
  if (typeof window === "undefined") {
    return DEFAULT_LAYOUT;
  }

  try {
    const storedLayoutJson = localStorage.getItem(
      RELEASES_TABLE_LAYOUT_STORAGE_KEY,
    );
    if (!storedLayoutJson) {
      return DEFAULT_LAYOUT;
    }

    const storedLayout = JSON.parse(
      storedLayoutJson,
    ) as Partial<ReleasesTableLayoutState> & {
      columnPinning?: unknown;
    };

    return {
      columnSizing: storedLayout.columnSizing ?? {},
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
};

const writeLayout = (layout: ReleasesTableLayoutState) => {
  localStorage.setItem(
    RELEASES_TABLE_LAYOUT_STORAGE_KEY,
    JSON.stringify(layout),
  );
};

export const useReleasesTableLayout = () => {
  const [layout, setLayout] = useState<ReleasesTableLayoutState>(readLayout);

  const onColumnSizingChange = useCallback<OnChangeFn<ColumnSizingState>>(
    (updater) => {
      setLayout((previous) => {
        const columnSizing =
          typeof updater === "function"
            ? updater(previous.columnSizing)
            : updater;
        const next = { ...previous, columnSizing };
        writeLayout(next);
        return next;
      });
    },
    [],
  );

  return {
    columnSizing: layout.columnSizing,
    onColumnSizingChange,
  };
};
