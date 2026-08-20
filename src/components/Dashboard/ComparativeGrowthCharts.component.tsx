"use client";

import classNames from "classnames";
import { type ReactNode, useMemo, useState } from "react";
import Select from "src/components/Select/Select.component";
import { TanstackChart } from "src/components/TanstackChart/TanstackChart.component";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import segmentedStyles from "src/styles/modules/segmented-control.module.css";
import { getChartColor, useChartColors } from "src/utils/chartColors";
import {
  analyzeTagGrowthFromDates,
  collectArtistOptions,
  collectGenreOptions,
  collectMediaTypeOptions,
  collectStyleOptionsForGenre,
  type DualSeriesPoint,
  mergeDualCumulativeSeries,
  mergeStyleWithinGenreShareSeries,
  releaseHasArtist,
  releaseHasGenre,
  releaseHasGenreAndStyle,
  releaseHasMediaType,
  type TagOption,
} from "src/utils/tagGrowthTracker";
import {
  createDualSeriesAreaChartDefinition,
  formatMonthYear,
} from "src/utils/tanstackCharts";
import styles from "./ComparativeGrowthCharts.module.css";

interface ComparativeGrowthChartsProps {
  hideHeading?: boolean;
}

type StyleGenreViewMode = "cumulative" | "share";

interface ComparisonChartCardProps {
  title: string;
  testId: string;
  primarySelectLabel: string;
  secondarySelectLabel: string;
  primaryOptions: TagOption[];
  secondaryOptions: TagOption[];
  resolvedPrimary: string;
  resolvedSecondary: string;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  primaryLegendLabel: string;
  secondaryLegendLabel: string;
  chartData: DualSeriesPoint[];
  primaryColor: string;
  secondaryColor: string;
  valueFormat: "count" | "percent";
  emptyMessage: string;
  ariaLabel: string;
  headerExtra?: ReactNode;
}

const toSelectOptions = (options: TagOption[]) =>
  options.map((option) => ({
    value: option.value,
    label: `${option.label} (${option.count})`,
  }));

function ComparisonChartCard({
  title,
  testId,
  primarySelectLabel,
  secondarySelectLabel,
  primaryOptions,
  secondaryOptions,
  resolvedPrimary,
  resolvedSecondary,
  onPrimaryChange,
  onSecondaryChange,
  primaryLegendLabel,
  secondaryLegendLabel,
  chartData,
  primaryColor,
  secondaryColor,
  valueFormat,
  emptyMessage,
  ariaLabel,
  headerExtra,
}: ComparisonChartCardProps) {
  const definition = useMemo(
    () =>
      createDualSeriesAreaChartDefinition(chartData, {
        primaryColor,
        secondaryColor,
        primaryLabel: primaryLegendLabel,
        secondaryLabel: secondaryLegendLabel,
        formatX: formatMonthYear,
        valueFormat,
      }),
    [
      chartData,
      primaryColor,
      primaryLegendLabel,
      secondaryColor,
      secondaryLegendLabel,
      valueFormat,
    ],
  );

  return (
    <article className={styles.chartContainer} data-testid={testId}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {headerExtra}
      </div>
      <div className={styles.controls}>
        {primaryOptions.length > 0 ? (
          <Select
            className={styles.select}
            label={primarySelectLabel}
            options={toSelectOptions(primaryOptions)}
            showLabel={true}
            value={resolvedPrimary}
            onChange={(value) => onPrimaryChange(String(value))}
          />
        ) : null}
        {secondaryOptions.length > 0 ? (
          <Select
            className={styles.select}
            label={secondarySelectLabel}
            options={toSelectOptions(secondaryOptions)}
            showLabel={true}
            value={resolvedSecondary}
            onChange={(value) => onSecondaryChange(String(value))}
          />
        ) : null}
      </div>

      {chartData.length > 0 ? (
        <>
          <ul aria-label="Chart legend" className={styles.legend}>
            <li className={styles.legendItem}>
              <span
                aria-hidden="true"
                className={styles.legendSwatch}
                style={{ backgroundColor: primaryColor }}
              />
              <span className={styles.legendLabel}>{primaryLegendLabel}</span>
            </li>
            <li className={styles.legendItem}>
              <span
                aria-hidden="true"
                className={styles.legendSwatch}
                style={{ backgroundColor: secondaryColor }}
              />
              <span className={styles.legendLabel}>{secondaryLegendLabel}</span>
            </li>
          </ul>
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel={ariaLabel}
              definition={definition}
              height={260}
            />
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <p>{emptyMessage}</p>
        </div>
      )}
    </article>
  );
}

function StyleGenreViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: StyleGenreViewMode;
  onChange: (mode: StyleGenreViewMode) => void;
}) {
  return (
    <fieldset className={segmentedStyles.container}>
      <legend
        className={classNames(
          segmentedStyles.legend,
          accessibilityStyles.visuallyHidden,
        )}
      >
        Style in genre chart view
      </legend>
      <button
        type="button"
        className={classNames(segmentedStyles.segment, {
          [segmentedStyles.active]: viewMode === "cumulative",
        })}
        onClick={() => onChange("cumulative")}
        aria-pressed={viewMode === "cumulative"}
      >
        Total
      </button>
      <button
        type="button"
        className={classNames(segmentedStyles.segment, {
          [segmentedStyles.active]: viewMode === "share",
        })}
        onClick={() => onChange("share")}
        aria-pressed={viewMode === "share"}
      >
        Share
      </button>
    </fieldset>
  );
}

export function ComparativeGrowthCharts({
  hideHeading = false,
}: ComparativeGrowthChartsProps) {
  const releases = useAllReleases();
  const colors = useChartColors();

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

  if (!(showStyleGenre || showFormat || showArtist)) {
    return null;
  }

  return (
    <section
      aria-labelledby={hideHeading ? undefined : "fmdComparativeGrowthHeading"}
      className={styles.section}
      data-testid="fmdComparativeGrowthCharts"
    >
      {!hideHeading ? (
        <h2 className={styles.sectionTitle} id="fmdComparativeGrowthHeading">
          Comparative growth
        </h2>
      ) : null}

      <div className={styles.comparativeGrid}>
        {showStyleGenre ? (
          <ComparisonChartCard
            ariaLabel={`${styleInGenreLegendLabel} ${styleGenreViewMode === "share" ? "share" : "growth"} compared with ${allGenreLegendLabel}`}
            chartData={styleGenreData}
            emptyMessage="No matching records yet for this style within the selected genre."
            headerExtra={
              <StyleGenreViewToggle
                onChange={setStyleGenreViewMode}
                viewMode={styleGenreViewMode}
              />
            }
            onPrimaryChange={(value) => {
              setSelectedGenre(String(value));
              setSelectedStyle(null);
            }}
            onSecondaryChange={setSelectedStyle}
            primaryColor={getChartColor(colors, 0)}
            primaryLegendLabel={styleInGenreLegendLabel}
            primaryOptions={genreOptions}
            primarySelectLabel="Genre"
            resolvedPrimary={resolvedGenre}
            resolvedSecondary={resolvedStyle}
            secondaryColor={getChartColor(colors, 2)}
            secondaryLegendLabel={allGenreLegendLabel}
            secondaryOptions={styleOptionsForGenre}
            secondarySelectLabel="Style"
            testId="fmdStyleGenreGrowthChart"
            title="Style in genre"
            valueFormat={styleGenreViewMode === "share" ? "percent" : "count"}
          />
        ) : null}

        {showFormat ? (
          <ComparisonChartCard
            ariaLabel={`Format growth for ${selectedFormatPrimaryLabel} and ${selectedFormatSecondaryLabel}`}
            chartData={formatData}
            emptyMessage="No matching records yet for this format pair."
            onPrimaryChange={setSelectedFormatPrimary}
            onSecondaryChange={setSelectedFormatSecondary}
            primaryColor={getChartColor(colors, 1)}
            primaryLegendLabel={selectedFormatPrimaryLabel}
            primaryOptions={formatOptions}
            primarySelectLabel="Format A"
            resolvedPrimary={resolvedFormatPrimary}
            resolvedSecondary={resolvedFormatSecondary}
            secondaryColor={getChartColor(colors, 3)}
            secondaryLegendLabel={selectedFormatSecondaryLabel}
            secondaryOptions={formatOptions}
            secondarySelectLabel="Format B"
            testId="fmdFormatGrowthChart"
            title="Format"
            valueFormat="count"
          />
        ) : null}

        {showArtist ? (
          <ComparisonChartCard
            ariaLabel={`Artist growth for ${selectedArtistPrimaryLabel} and ${selectedArtistSecondaryLabel}`}
            chartData={artistData}
            emptyMessage="No matching records yet for this artist pair."
            onPrimaryChange={setSelectedArtistPrimary}
            onSecondaryChange={setSelectedArtistSecondary}
            primaryColor={getChartColor(colors, 4)}
            primaryLegendLabel={selectedArtistPrimaryLabel}
            primaryOptions={artistOptions}
            primarySelectLabel="Artist A"
            resolvedPrimary={resolvedArtistPrimary}
            resolvedSecondary={resolvedArtistSecondary}
            secondaryColor={getChartColor(colors, 5)}
            secondaryLegendLabel={selectedArtistSecondaryLabel}
            secondaryOptions={artistOptions}
            secondarySelectLabel="Artist B"
            testId="fmdArtistGrowthChart"
            title="Artist"
            valueFormat="count"
          />
        ) : null}
      </div>
    </section>
  );
}
