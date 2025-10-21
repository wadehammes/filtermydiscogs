"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import Image from "next/image";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import LoadingOverlay from "src/components/LoadingOverlay/LoadingOverlay.component";
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
  ({ releases, isMobile, highlightedReleaseId, onExitRandomMode }) => {
    const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
    const { state: filtersState, dispatch: filtersDispatch } = useFilters();
    const [sorting, setSorting] = useState<SortingState>([]);

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

    const _handleCrateToggle = useCallback(
      (e: React.MouseEvent, release: DiscogsRelease) => {
        e.preventDefault();
        e.stopPropagation();

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
                  onChange={(e) => {
                    e.stopPropagation();
                    if (isInCrate(release.instance_id)) {
                      removeFromCrate(release.instance_id);
                    } else {
                      addToCrate(release);
                      openDrawer();
                    }
                  }}
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
        }),
        columnHelper.accessor("basic_information.title", {
          id: "title",
          header: "Title",
          cell: ({ getValue }) => {
            const title = getValue();
            return <div className={styles.titleCell}>{title}</div>;
          },
          size: 220,
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
                    className={classNames(styles.formatPill, {
                      [styles.formatPillSelected as string]:
                        filtersState.selectedFormats.includes(formatName),
                    })}
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
                    className={classNames(styles.stylePill, {
                      [styles.stylePillSelected as string]:
                        filtersState.selectedStyles.includes(style),
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
        isInCrate,
        openDrawer,
        removeFromCrate,
        addToCrate,
      ],
    );

    const table = useReactTable({
      data: releases,
      columns,
      state: {
        sorting,
      },
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    });

    if (isMobile) {
      return (
        <div className={styles.mobileContainer}>
          {releases.map((release) => (
            <MobileReleaseCard
              key={release.instance_id}
              release={release}
              isHighlighted={highlightedReleaseId === release.instance_id}
              onExitRandomMode={onExitRandomMode}
            />
          ))}
        </div>
      );
    }

    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className={styles.headerRow}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={classNames(styles.headerCell, {
                      [styles.sortable as string]: header.column.getCanSort(),
                    })}
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className={styles.headerContent}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() && (
                        <span className={styles.sortIcon}>
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted() as string] ?? "↕"}
                        </span>
                      )}
                    </div>
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);

// Mobile card component for small screens
const MobileReleaseCard = memo<{
  release: DiscogsRelease;
  isHighlighted: boolean;
  onExitRandomMode: () => void;
}>(({ release, isHighlighted }) => {
  const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const [isClicked, setIsClicked] = useState(false);

  const {
    labels,
    year,
    artists,
    title,
    thumb,
    styles: releaseStyles,
    formats: releaseFormats,
    resource_url,
  } = release.basic_information;

  const thumbUrl = thumb
    ? thumb
    : "https://placehold.jp/effbf2/000/60x60.png?text=%F0%9F%98%B5";

  const { data: releaseData, isLoading } = useDiscogsReleaseQuery(
    resource_url.split("/").pop() || "",
    isClicked,
  );

  const handleReleaseClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsClicked(true);

      trackEvent("releaseClicked", {
        action: "releaseClicked",
        category: "home",
        label: "Release Clicked (Mobile Table View)",
        value: resource_url,
      });

      if (releaseData?.uri) {
        window.open(releaseData.uri, "_blank", "noopener,noreferrer");
        return;
      }
    },
    [releaseData?.uri, resource_url],
  );

  const handleCrateToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isInCrate(release.instance_id)) {
        removeFromCrate(release.instance_id);
      } else {
        addToCrate(release);
        openDrawer();
      }
    },
    [isInCrate, addToCrate, removeFromCrate, openDrawer, release],
  );

  return (
    <>
      <div
        className={classNames(styles.mobileCard, {
          [styles.highlighted as string]: isHighlighted,
          [styles.inCrate as string]: isInCrate(release.instance_id),
        })}
      >
        <div className={styles.mobileImageContainer}>
          <Image
            src={thumbUrl}
            height={60}
            width={60}
            quality={85}
            alt={title}
            loading="lazy"
            sizes="60px"
          />
        </div>

        <div className={styles.mobileContent}>
          <div className={styles.mobileMainInfo}>
            <h3 className={styles.mobileTitle}>
              {artists.map((artist) => artist.name).join(", ")} - {title}
            </h3>
            <p className={styles.mobileDetails}>
              {labels[0]?.name} {year !== 0 ? `— ${year}` : ""}
            </p>
            {releaseFormats && releaseFormats.length > 0 && (
              <div className={styles.mobileFormats}>
                {Array.from(
                  new Set(releaseFormats.map((format) => format.name)),
                )
                  .slice(0, 2)
                  .map((formatName) => (
                    <button
                      key={formatName}
                      type="button"
                      className={classNames(styles.formatPill, {
                        [styles.formatPillSelected as string]:
                          filtersState.selectedFormats.includes(formatName),
                      })}
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
                {Array.from(
                  new Set(releaseFormats.map((format) => format.name)),
                ).length > 2 && (
                  <span className={styles.moreFormats}>
                    +
                    {Array.from(
                      new Set(releaseFormats.map((format) => format.name)),
                    ).length - 2}{" "}
                    more
                  </span>
                )}
              </div>
            )}
            {releaseStyles && releaseStyles.length > 0 && (
              <div className={styles.mobileStyles}>
                {releaseStyles.slice(0, 3).map((style: string) => (
                  <button
                    key={style}
                    type="button"
                    className={classNames(styles.stylePill, {
                      [styles.stylePillSelected as string]:
                        filtersState.selectedStyles.includes(style),
                    })}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      filtersDispatch({
                        type: FiltersActionTypes.ToggleStyle,
                        payload: style,
                      });
                    }}
                    aria-label={`Filter by ${style} style`}
                  >
                    {style}
                  </button>
                ))}
                {releaseStyles.length > 3 && (
                  <span className={styles.moreStyles}>
                    +{releaseStyles.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.mobileActions}>
            <button
              type="button"
              className={styles.crateButton}
              onClick={handleCrateToggle}
              aria-label={
                isInCrate(release.instance_id)
                  ? "Remove from crate"
                  : "Add to crate"
              }
            >
              {isInCrate(release.instance_id) ? "− Remove" : "+ Add"}
            </button>
            <button
              type="button"
              className={styles.discogsButton}
              onClick={handleReleaseClick}
              disabled={isLoading}
            >
              View on Discogs
            </button>
          </div>
        </div>
      </div>
      <LoadingOverlay
        message="Fetching Discogs Release URL"
        isVisible={isLoading}
      />
    </>
  );
});

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
MobileReleaseCard.displayName = "MobileReleaseCard";
ReleaseLinkButton.displayName = "ReleaseLinkButton";

export default ReleasesTable;
