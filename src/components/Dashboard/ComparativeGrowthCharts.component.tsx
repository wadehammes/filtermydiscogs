"use client";

import { ComparisonChartCard } from "src/components/Dashboard/ComparisonChartCard.component";
import { StyleGenreViewToggle } from "src/components/Dashboard/StyleGenreViewToggle.component";
import { useComparativeGrowthChartsState } from "src/components/Dashboard/useComparativeGrowthChartsState.hook";
import { getChartColor, useChartColors } from "src/utils/chartColors";
import styles from "./ComparativeGrowthCharts.module.css";

interface ComparativeGrowthChartsProps {
  hideHeading?: boolean;
}

export function ComparativeGrowthCharts({
  hideHeading = false,
}: ComparativeGrowthChartsProps) {
  const colors = useChartColors();
  const {
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
  } = useComparativeGrowthChartsState();

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
