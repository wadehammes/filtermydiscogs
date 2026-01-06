"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import Image from "next/image";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import LoadingOverlay from "src/components/LoadingOverlay/LoadingOverlay.component";
import ReleaseCard from "src/components/ReleaseCard/ReleaseCard.component";
import { useCrate } from "src/context/crate.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleasesTable.module.css";

interface ReleasesTableProps {
  releases: DiscogsRelease[];
  isMobile: boolean;
  isRandomMode: boolean;
  highlightedReleaseId: string | null;
  onExitRandomMode: () => void;
}

const columnHelper = createColumnHelper<DiscogsRelease>();

export const ReleasesTable = memo<ReleasesTableProps>(
  ({
    releases,
    isMobile,
    isRandomMode,
    highlightedReleaseId,
    onExitRandomMode,
  }) => {
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
          header: "",
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
        columnHelper.display({
          id: "artistTitle",
          header: "Artist / Title",
          cell: ({ row }) => {
            const artists = row.original.basic_information.artists;
            const title = row.original.basic_information.title;
            const artistNames = artists.map((artist) => artist.name).join(", ");
            return (
              <div className={styles.artistTitleCell}>
                <span className={styles.artistName}>{artistNames}</span>
                <span className={styles.titleName}>{title}</span>
              </div>
            );
          },
          size: 300,
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
          header: "Release Year",
          cell: ({ getValue }) => {
            const year = getValue();
            return (
              <div className={styles.yearCell}>{year !== 0 ? year : "—"}</div>
            );
          },
          size: 60,
          enableSorting: false,
        }),
        columnHelper.accessor("date_added", {
          id: "dateAdded",
          header: "Date Added",
          cell: ({ getValue }) => {
            const dateString = getValue();
            if (!dateString)
              return <div className={styles.dateAddedCell}>—</div>;

            try {
              const date = new Date(dateString);
              const formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <div className={styles.dateAddedCell}>{formattedDate}</div>
              );
            } catch {
              return <div className={styles.dateAddedCell}>—</div>;
            }
          },
          size: 120,
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
                {uniqueFormats.map((formatName) => (
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
                {releaseStyles.map((style: string) => (
                  <button
                    key={style}
                    type="button"
                    className={classNames(
                      "pill",
                      "pillStyle",
                      styles.stylePill,
                      {
                        pillSelected:
                          filtersState.selectedStyles.includes(style),
                      },
                    )}
                    onClick={(e) => handleStylePillClick(e, style)}
                    aria-label={`Filter by ${style} style`}
                  >
                    {style}
                  </button>
                ))}
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

    const table = useReactTable({
      data: releases,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    if (isMobile) {
      return (
        <div className={styles.mobileContainer}>
          {releases.map((release) => (
            <ReleaseCard
              key={release.instance_id}
              release={release}
              isHighlighted={highlightedReleaseId === release.instance_id}
              isRandomMode={isRandomMode}
              onExitRandomMode={onExitRandomMode}
            />
          ))}
        </div>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={styles.headerRow}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={styles.headerCell}
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className={styles.tbody}>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={classNames(styles.dataRow, {
                    [styles.highlighted as string]:
                      highlightedReleaseId === row.original.instance_id,
                    [styles.inCrate as string]: isInCrate(
                      row.original.instance_id,
                    ),
                  })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={styles.dataCell}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

// Release link button component
const ReleaseLinkButton = memo<{ release: DiscogsRelease }>(({ release }) => {
  const [isClicked, setIsClicked] = useState(false);
  const { data: releaseData, isLoading } = useDiscogsReleaseQuery(
    release.basic_information.resource_url.split("/").pop() || "",
    isClicked,
  );

  const handleReleaseClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsClicked(true);

      trackEvent("releaseClicked", {
        action: "releaseClicked",
        category: "releasesTable",
        label: "Release Clicked (Table View)",
        value: release.basic_information.resource_url,
      });

      if (releaseData?.uri) {
        window.open(releaseData.uri, "_blank", "noopener,noreferrer");
        return;
      }
    },
    [releaseData?.uri, release.basic_information.resource_url],
  );

  useEffect(() => {
    if (isClicked && releaseData?.uri) {
      window.open(releaseData.uri, "_blank", "noopener,noreferrer");
      setIsClicked(false);
    }
  }, [isClicked, releaseData?.uri]);

  return (
    <>
      <button
        type="button"
        className={styles.discogsButton}
        onClick={handleReleaseClick}
        disabled={isLoading}
        aria-label="View on Discogs"
      >
        View
      </button>
      <LoadingOverlay
        message="Fetching Discogs Release URL"
        isVisible={isLoading}
      />
    </>
  );
});

ReleasesTable.displayName = "ReleasesTable";
ReleaseLinkButton.displayName = "ReleaseLinkButton";

export default ReleasesTable;
