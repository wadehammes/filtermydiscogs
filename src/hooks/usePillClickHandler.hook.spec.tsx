import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue } from "jotai";
import {
  selectedFormatsAtom,
  selectedStylesAtom,
} from "src/atoms/filters.atoms";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { act, renderFeatureHook } from "test-utils";

describe("usePillClickHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("supports being called with no options", () => {
    const releases = [releaseFactory.withStyles(["Rock"])];

    const { result } = renderFeatureHook(
      () => {
        const handlePillClick = usePillClickHandler();
        const selectedStyles = useAtomValue(selectedStylesAtom);

        return { handlePillClick, selectedStyles };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlePillClick({
        event: {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        } as unknown as React.MouseEvent,
        value: "Rock",
        type: "style",
      });
    });

    expect(result.current.selectedStyles).toEqual(["Rock"]);
  });

  it("toggles format filters", () => {
    const releases = [releaseFactory.build()];

    const { result } = renderFeatureHook(
      () => {
        const handlePillClick = usePillClickHandler({});
        const selectedFormats = useAtomValue(selectedFormatsAtom);

        return { handlePillClick, selectedFormats };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlePillClick({
        event: {
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        } as unknown as React.MouseEvent,
        value: "Vinyl",
        type: "format",
      });
    });

    expect(result.current.selectedFormats).toEqual(["Vinyl"]);
  });
});
