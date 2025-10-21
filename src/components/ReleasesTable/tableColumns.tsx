"use client";

import { createColumnHelper } from "@tanstack/react-table";
import classNames from "classnames";
import Image from "next/image";
import type React from "react";
import { useCallback, useMemo } from "react";
import { trackEvent } from "src/analytics/analytics";
import { useCrate } from "src/context/crate.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleasesTable.module.css";

const columnHelper = createColumnHelper<DiscogsRelease>();

export const useTableColumns = (onExitRandomMode: () => void) => {
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();

  const handleStylePillClick = useCallback(
    (e: React.MouseEvent, style: string) => {
      e.preventDefault();
      e.stopPropagation();

      trackEvent("stylePillClicked", {
        action: "stylePillClicked",
        category: "releasesTable",
        label: "Style Pill Clicked",
        value: style,
      });

      // Exit random mode when clicking a style pill
      if (filtersState.isRandomMode) {
        filtersDispatch({
          type: FiltersActionTypes.ToggleRandomMode,
          payload: undefined,
        });
        onExitRandomMode?.();
      }

      filtersDispatch({
        type: FiltersActionTypes.ToggleStyle,
        payload: style,
      });
    },
    [filtersDispatch, filtersState.isRandomMode, onExitRandomMode],
  );

  const handleCheckboxChange = useCallback(
    (release: DiscogsRelease) => {
      if (isInCrate(release.instance_id)) {
        removeFromCrate(release.instance_id);
      } else {
        addToCrate(release);
        openDrawer();
      }
    },
    [isInCrate, addToCrate, removeFromCrate, openDrawer],
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "checkbox",
        header: "In Crate",
        cell: ({ row }) => {
          const release = row.original;
          return (
            <div className={styles.checkboxCell}>
              <input
                type="checkbox"
                className={styles.crateCheckbox}
                checked={isInCrate(release.instance_id)}
                onChange={() => handleCheckboxChange(release)}
                aria-label={
                  isInCrate(release.instance_id)
                    ? "Remove from crate"
                    : "Add to crate"
                }
              />
            </div>
          );
        },
        size: 40,
        enableSorting: false,
      }),
      columnHelper.accessor("basic_information.thumb", {
        id: "image",
        header: "Discogs Link",
        cell: ({ getValue, row }) => {
          const thumb = getValue();
          const title = row.original.basic_information.title;
          const release = row.original;
          const thumbUrl = thumb
            ? thumb
            : "https://placehold.jp/effbf2/000/40x40.png?text=%F0%9F%98%B5";

          return (
            <div className={styles.imageCell}>
              <button
                type="button"
                className={styles.imageButton}
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle the click to open Discogs link
                  const releaseId =
                    release.basic_information.resource_url.split("/").pop() ||
                    "";
                  const fallbackUri = `https://www.discogs.com/release/${releaseId}`;
                  window.open(fallbackUri, "_blank", "noopener,noreferrer");
                }}
                aria-label={`View ${title} on Discogs`}
              >
                <Image
                  src={thumbUrl}
                  height={40}
                  width={40}
                  quality={85}
                  alt={title}
                  loading="lazy"
                  sizes="40px"
                />
              </button>
            </div>
          );
        },
        size: 50,
        enableSorting: false,
      }),
      columnHelper.accessor("basic_information.artists", {
        id: "artist",
        header: "Artist",
        cell: ({ getValue }) => {
          const artists = getValue();
          return (
            <div className={styles.artistCell}>
              {artists.map((artist) => artist.name).join(", ")}
            </div>
          );
        },
        size: 180,
        enableSorting: false,
      }),
      columnHelper.accessor("basic_information.title", {
        id: "title",
        header: "Title",
        cell: ({ getValue }) => {
          const title = getValue();
          return <div className={styles.titleCell}>{title}</div>;
        },
        size: 220,
        enableSorting: false,
      }),
      columnHelper.accessor("basic_information.labels", {
        id: "label",
        header: "Label",
        cell: ({ getValue }) => {
          const labels = getValue();
          return (
            <div className={styles.labelCell}>
              {labels[0]?.name || "Unknown"}
            </div>
          );
        },
        size: 120,
        enableSorting: false,
      }),
      columnHelper.accessor("basic_information.year", {
        id: "year",
        header: "Year",
        cell: ({ getValue }) => {
          const year = getValue();
          return (
            <div className={styles.yearCell}>{year !== 0 ? year : "—"}</div>
          );
        },
        size: 60,
        enableSorting: false,
      }),
      columnHelper.accessor("basic_information.formats", {
        id: "formats",
        header: "Format",
        cell: ({ getValue }) => {
          const releaseFormats = getValue();
          if (!releaseFormats || releaseFormats.length === 0) return null;

          const uniqueFormats = Array.from(
            new Set(releaseFormats.map((format) => format.name)),
          );

          return (
            <div className={styles.formatsCell}>
              {uniqueFormats.slice(0, 2).map((formatName) => (
                <button
                  key={formatName}
                  type="button"
                  className={classNames(
                    "pill",
                    "pillFormat",
                    styles.formatPill,
                    {
                      pillSelected:
                        filtersState.selectedFormats.includes(formatName),
                    },
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    filtersDispatch({
                      type: FiltersActionTypes.ToggleFormat,
                      payload: formatName,
                    });
                  }}
                  aria-label={`Filter by ${formatName} format`}
                >
                  {formatName}
                </button>
              ))}
              {uniqueFormats.length > 2 && (
                <span className={styles.moreFormats}>
                  +{uniqueFormats.length - 2}
                </span>
              )}
            </div>
          );
        },
        size: 120,
        enableSorting: false,
      }),
      columnHelper.accessor("basic_information.styles", {
        id: "styles",
        header: "Styles",
        cell: ({ getValue }) => {
          const releaseStyles = getValue();
          if (!releaseStyles || releaseStyles.length === 0) return null;

          return (
            <div className={styles.stylesCell}>
              {releaseStyles.slice(0, 2).map((style: string) => (
                <button
                  key={style}
                  type="button"
                  className={classNames("pill", "pillStyle", styles.stylePill, {
                    pillSelected: filtersState.selectedStyles.includes(style),
                  })}
                  onClick={(e) => handleStylePillClick(e, style)}
                  aria-label={`Filter by ${style} style`}
                >
                  {style}
                </button>
              ))}
              {releaseStyles.length > 2 && (
                <span className={styles.moreStyles}>
                  +{releaseStyles.length - 2}
                </span>
              )}
            </div>
          );
        },
        size: 150,
        enableSorting: false,
      }),
    ],
    [
      filtersState.selectedStyles,
      filtersState.selectedFormats,
      filtersDispatch,
      handleStylePillClick,
      handleCheckboxChange,
      isInCrate,
    ],
  );

  return columns;
};
