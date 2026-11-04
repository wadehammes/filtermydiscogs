import { describe, expect, it } from "@jest/globals";
import { useAtomValue, useSetAtom } from "jotai";
import {
  collectionFiltersActiveAtom,
  filtersDispatchAtom,
  selectedSortSecondaryAtom,
  sortedFilteredReleasesAtom,
} from "src/atoms/filters.atoms";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import { FiltersActionTypes } from "src/context/filters.context";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { defaultPersistedFilters } from "src/utils/filtersStorage";
import { act, renderHook, TestProviders } from "test-utils";

describe("filters secondary sort integration", () => {
  it("reorders tied primary artist groups when only secondary sort is updated", () => {
    const sharedArtist = artistFactory.build({ name: "Shared Artist" });
    const releaseOld = releaseFactory.withDateAdded(
      "2019-06-01T00:00:00.000Z",
      {
        basic_information: { artists: [sharedArtist] },
      },
    );
    const releaseNew = releaseFactory.withDateAdded(
      "2024-06-01T00:00:00.000Z",
      {
        basic_information: { artists: [sharedArtist] },
      },
    );
    const releaseOther = releaseFactory.withDateAdded(
      "2025-01-01T00:00:00.000Z",
      {
        basic_information: {
          artists: [artistFactory.build({ name: "Zulu Artist" })],
        },
      },
    );
    const releases = [releaseNew, releaseOther, releaseOld];

    const { result } = renderHook(
      () => ({
        dispatch: useSetAtom(filtersDispatchAtom),
        setActive: useSetAtom(collectionFiltersActiveAtom),
        sorted: useAtomValue(sortedFilteredReleasesAtom),
        secondary: useAtomValue(selectedSortSecondaryAtom),
      }),
      { wrapper: TestProviders },
    );

    act(() => {
      result.current.setActive(true);
      result.current.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: releases,
      });
      result.current.dispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.AZArtist,
      });
    });

    const beforeSecondary = result.current.sorted.map(
      (release) => release.instance_id,
    );

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSortSecondary,
        payload: SortValues.DateAddedOld,
      });
    });

    expect(result.current.secondary).toBe(SortValues.DateAddedOld);
    expect(result.current.sorted.map((release) => release.instance_id)).toEqual(
      [
        releaseOld.instance_id,
        releaseNew.instance_id,
        releaseOther.instance_id,
      ],
    );
    expect(
      result.current.sorted.map((release) => release.instance_id),
    ).not.toEqual(beforeSecondary);
  });

  it("reorders same UTC day when primary is date added and secondary is artist", () => {
    const releaseLaterZebra = releaseFactory.withDateAdded(
      "2024-06-01T20:00:00.000Z",
      {
        basic_information: {
          artists: [artistFactory.build({ name: "Zebra Artist" })],
        },
      },
    );
    const releaseEarlierAlpha = releaseFactory.withDateAdded(
      "2024-06-01T08:00:00.000Z",
      {
        basic_information: {
          artists: [artistFactory.build({ name: "Alpha Artist" })],
        },
      },
    );
    const releases = [releaseLaterZebra, releaseEarlierAlpha];

    const { result } = renderHook(
      () => ({
        dispatch: useSetAtom(filtersDispatchAtom),
        setActive: useSetAtom(collectionFiltersActiveAtom),
        sorted: useAtomValue(sortedFilteredReleasesAtom),
      }),
      { wrapper: TestProviders },
    );

    act(() => {
      result.current.setActive(true);
      result.current.dispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: releases,
      });
      result.current.dispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.DateAddedNew,
      });
      result.current.dispatch({
        type: FiltersActionTypes.SetSortSecondary,
        payload: SortValues.AZArtist,
      });
    });

    expect(result.current.sorted.map((release) => release.instance_id)).toEqual(
      [releaseEarlierAlpha.instance_id, releaseLaterZebra.instance_id],
    );
  });

  it("clears secondary sort when Then by is the opposite direction on the same field", () => {
    const { result } = renderHook(
      () => ({
        dispatch: useSetAtom(filtersDispatchAtom),
        secondary: useAtomValue(selectedSortSecondaryAtom),
      }),
      { wrapper: TestProviders },
    );

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.DateAddedNew,
      });
      result.current.dispatch({
        type: FiltersActionTypes.SetSortSecondary,
        payload: SortValues.DateAddedOld,
      });
    });

    expect(result.current.secondary).toBe(SortSecondaryValues.None);
  });

  it("clears secondary sort when primary changes to the same field as Then by", () => {
    const { result } = renderHook(
      () => ({
        dispatch: useSetAtom(filtersDispatchAtom),
        secondary: useAtomValue(selectedSortSecondaryAtom),
      }),
      { wrapper: TestProviders },
    );

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.AZArtist,
      });
      result.current.dispatch({
        type: FiltersActionTypes.SetSortSecondary,
        payload: SortValues.DateAddedOld,
      });
      result.current.dispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.DateAddedNew,
      });
    });

    expect(result.current.secondary).toBe(SortSecondaryValues.None);
  });

  it("normalizes Then by when applying saved filters with a conflicting secondary sort", () => {
    const { result } = renderHook(
      () => ({
        dispatch: useSetAtom(filtersDispatchAtom),
        secondary: useAtomValue(selectedSortSecondaryAtom),
      }),
      { wrapper: TestProviders },
    );

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.ApplySessionFilters,
        payload: {
          ...defaultPersistedFilters,
          selectedSort: SortValues.DateAddedNew,
          selectedSortSecondary: SortValues.DateAddedOld,
        },
      });
    });

    expect(result.current.secondary).toBe(SortSecondaryValues.None);
  });

  it("clears secondary sort when Then by matches the primary sort", () => {
    const { result } = renderHook(
      () => ({
        dispatch: useSetAtom(filtersDispatchAtom),
        secondary: useAtomValue(selectedSortSecondaryAtom),
      }),
      { wrapper: TestProviders },
    );

    act(() => {
      result.current.dispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.AZArtist,
      });
      result.current.dispatch({
        type: FiltersActionTypes.SetSortSecondary,
        payload: SortValues.AZArtist,
      });
    });

    expect(result.current.secondary).toBe(SortSecondaryValues.None);
  });
});
