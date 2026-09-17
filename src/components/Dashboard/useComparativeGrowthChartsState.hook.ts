"use client";

import { useMemo, useState } from "react";
import type { StyleGenreViewMode } from "src/components/Dashboard/StyleGenreViewToggle.component";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import {
  analyzeTagGrowthFromDates,
  collectArtistOptions,
  collectGenreOptions,
  collectMediaTypeOptions,
  collectStyleOptionsForGenre,
  mergeDualCumulativeSeries,
  mergeStyleWithinGenreShareSeries,
  releaseHasArtist,
  releaseHasGenre,
  releaseHasGenreAndStyle,
  releaseHasMediaType,
} from "src/utils/tagGrowthTracker";

export const useComparativeGrowthChartsState = () => {
  const releases = useAllReleases();

  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedFormatPrimary, setSelectedFormatPrimary] = useState<
    string | null
  >(null);
  const [selectedFormatSecondary, setSelectedFormatSecondary] = useState<
    string | null
  >(null);
  const [selectedArtistPrimary, setSelectedArtistPrimary] = useState<
    string | null
  >(null);
  const [selectedArtistSecondary, setSelectedArtistSecondary] = useState<
    string | null
  >(null);
  const [styleGenreViewMode, setStyleGenreViewMode] =
    useState<StyleGenreViewMode>("cumulative");

  const genreOptions = useMemo(
    () => collectGenreOptions(releases ?? []),
    [releases],
  );
  const resolvedGenre = selectedGenre ?? genreOptions[0]?.value ?? "";

  const styleOptionsForGenre = useMemo(
    () => collectStyleOptionsForGenre(releases ?? [], resolvedGenre),
    [releases, resolvedGenre],
  );

  const resolvedStyle =
    selectedStyle &&
    styleOptionsForGenre.some((option) => option.value === selectedStyle)
      ? selectedStyle
      : (styleOptionsForGenre[0]?.value ?? "");

  const formatOptions = useMemo(
    () => collectMediaTypeOptions(releases ?? []),
    [releases],
  );
  const artistOptions = useMemo(
    () => collectArtistOptions(releases ?? []),
    [releases],
  );

  const resolvedFormatPrimary =
    selectedFormatPrimary ?? formatOptions[0]?.value ?? "";
  const resolvedFormatSecondary =
    selectedFormatSecondary ??
    formatOptions[1]?.value ??
    formatOptions[0]?.value ??
    "";
  const resolvedArtistPrimary =
    selectedArtistPrimary ?? artistOptions[0]?.value ?? "";
  const resolvedArtistSecondary =
    selectedArtistSecondary ??
    artistOptions[1]?.value ??
    artistOptions[0]?.value ??
    "";

  const selectedStyleLabel =
    styleOptionsForGenre.find((option) => option.value === resolvedStyle)
      ?.label ?? resolvedStyle;
  const selectedGenreLabel =
    genreOptions.find((option) => option.value === resolvedGenre)?.label ??
    resolvedGenre;
  const styleInGenreLegendLabel = `${selectedStyleLabel} in ${selectedGenreLabel}`;
  const allGenreLegendLabel = `All ${selectedGenreLabel}`;
  const selectedFormatPrimaryLabel =
    formatOptions.find((option) => option.value === resolvedFormatPrimary)
      ?.label ?? resolvedFormatPrimary;
  const selectedFormatSecondaryLabel =
    formatOptions.find((option) => option.value === resolvedFormatSecondary)
      ?.label ?? resolvedFormatSecondary;
  const selectedArtistPrimaryLabel =
    artistOptions.find((option) => option.value === resolvedArtistPrimary)
      ?.label ?? resolvedArtistPrimary;
  const selectedArtistSecondaryLabel =
    artistOptions.find((option) => option.value === resolvedArtistSecondary)
      ?.label ?? resolvedArtistSecondary;

  const styleGenreData = useMemo(() => {
    if (!(releases && resolvedGenre && resolvedStyle)) {
      return [];
    }

    if (styleGenreViewMode === "share") {
      return mergeStyleWithinGenreShareSeries(
        releases,
        resolvedGenre,
        resolvedStyle,
      );
    }

    const styleInGenreGrowth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasGenreAndStyle(release, resolvedGenre, resolvedStyle),
    );
    const genreGrowth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasGenre(release, resolvedGenre),
    );

    return mergeDualCumulativeSeries(styleInGenreGrowth, genreGrowth);
  }, [releases, resolvedGenre, resolvedStyle, styleGenreViewMode]);

  const formatData = useMemo(() => {
    if (!(releases && resolvedFormatPrimary && resolvedFormatSecondary)) {
      return [];
    }

    const primaryGrowth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasMediaType(release, resolvedFormatPrimary),
    );
    const secondaryGrowth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasMediaType(release, resolvedFormatSecondary),
    );

    return mergeDualCumulativeSeries(primaryGrowth, secondaryGrowth);
  }, [releases, resolvedFormatPrimary, resolvedFormatSecondary]);

  const artistData = useMemo(() => {
    if (!(releases && resolvedArtistPrimary && resolvedArtistSecondary)) {
      return [];
    }

    const primaryGrowth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasArtist(release, resolvedArtistPrimary),
    );
    const secondaryGrowth = analyzeTagGrowthFromDates(releases, (release) =>
      releaseHasArtist(release, resolvedArtistSecondary),
    );

    return mergeDualCumulativeSeries(primaryGrowth, secondaryGrowth);
  }, [releases, resolvedArtistPrimary, resolvedArtistSecondary]);

  const showStyleGenre =
    genreOptions.length > 0 && styleOptionsForGenre.length > 0;
  const showFormat = formatOptions.length > 0;
  const showArtist = artistOptions.length > 0;

  return {
    genreOptions,
    styleOptionsForGenre,
    formatOptions,
    artistOptions,
    resolvedGenre,
    resolvedStyle,
    resolvedFormatPrimary,
    resolvedFormatSecondary,
    resolvedArtistPrimary,
    resolvedArtistSecondary,
    styleInGenreLegendLabel,
    allGenreLegendLabel,
    selectedFormatPrimaryLabel,
    selectedFormatSecondaryLabel,
    selectedArtistPrimaryLabel,
    selectedArtistSecondaryLabel,
    styleGenreData,
    formatData,
    artistData,
    styleGenreViewMode,
    setStyleGenreViewMode,
    setSelectedGenre,
    setSelectedStyle,
    setSelectedFormatPrimary,
    setSelectedFormatSecondary,
    setSelectedArtistPrimary,
    setSelectedArtistSecondary,
    showStyleGenre,
    showFormat,
    showArtist,
  };
};
