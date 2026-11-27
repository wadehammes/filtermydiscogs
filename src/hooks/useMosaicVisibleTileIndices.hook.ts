import { useEffect, useState } from "react";
import { listMosaicVisibleTileIndices } from "src/utils/listMosaicVisibleTileIndices";

type UseMosaicVisibleTileIndicesOptions = {
  cols: number;
  cellSize: number;
  itemCount: number;
  enabled: boolean;
};

export const useMosaicVisibleTileIndices = (
  scrollContainer: HTMLElement | null,
  { cols, cellSize, itemCount, enabled }: UseMosaicVisibleTileIndicesOptions,
): number[] => {
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);

  useEffect(() => {
    if (!(enabled && scrollContainer)) {
      setVisibleIndices([]);
      return;
    }

    const updateVisibleIndices = () => {
      setVisibleIndices(
        listMosaicVisibleTileIndices({
          scrollTop: scrollContainer.scrollTop,
          viewportHeight: scrollContainer.clientHeight,
          cellSize,
          cols,
          itemCount,
        }),
      );
    };

    updateVisibleIndices();

    scrollContainer.addEventListener("scroll", updateVisibleIndices, {
      passive: true,
    });
    const resizeObserver = new ResizeObserver(updateVisibleIndices);
    resizeObserver.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener("scroll", updateVisibleIndices);
      resizeObserver.disconnect();
    };
  }, [scrollContainer, enabled, cols, cellSize, itemCount]);

  return visibleIndices;
};
