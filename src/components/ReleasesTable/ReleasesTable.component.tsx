"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import Image from "next/image";
import { memo, useCallback, useMemo } from "react";
import { trackEvent } from "src/analytics/analytics";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { useCrate } from "src/context/crate.context";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import type { DiscogsRelease } from "src/types";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import styles from "./ReleasesTable.module.css";

interface ReleasesTableProps {
  releases: DiscogsRelease[];
  onExitRandomMode: () => void;
  onReleaseClick: (instanceId: string) => void;
}

const columnHelper = createColumnHelper<DiscogsRelease>();

export const ReleasesTable = memo<ReleasesTableProps>(
  ({ releases, onExitRandomMode, onReleaseClick }) => {
    const { addToCrate, removeFromCrate, isInCrate, openDrawer } = useCrate();
    const selectedStyles = useSelectedStyles();
    const selectedFormats = useSelectedFormats();

    const handlePillClick = usePillClickHandler({
      category: "releasesTable",
      onExitRandomMode,
    });

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

    const handleImageClick = useCallback(
      (release: DiscogsRelease) => {
        trackEvent("releaseClicked", {
          action: "releaseClicked",
          category: "releasesTable",
          label: "Release Image Clicked (Table View)",
          value: release.basic_information.resource_url,
        });
        onReleaseClick(String(release.instance_id));
      },
      [onReleaseClick],
    );

    const columns = useMemo(
      () => [
        columnHelper.display({
          id: "checkbox",
          header: "Crate",
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
            const thumbUrl = getReleaseImageUrl({
              thumb,
              cover_image: row.original.basic_information.cover_image,
              width: 40,
              height: 40,
              preferCoverImage: false,
            });

            return (
              <div className={styles.imageCell}>
                <button
                  type="button"
                  className={styles.imageButton}
                  title={`View ${title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(release);
                  }}
                  aria-label={`View ${title}`}
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
            const release = row.original;
            const artists = release.basic_information.artists;
            const title = release.basic_information.title;
            const resourceUrl = release.basic_information.resource_url;
            const releaseUrl = getResourceUrl({
              resourceUrl,
              type: "release",
            });

            return (
              <div className={styles.artistTitleCell}>
                <span className={styles.artistName}>
                  {artists.map((artist, index) => {
                    const artistUrl = getResourceUrl({
                      resourceUrl: artist.resource_url,
                      type: "artist",
                    });
                    return (
                      <span key={artist.id ?? `${artist.name}-${index}`}>
                        {artistUrl ? (
                          <a
                            href={artistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`View ${artist.name} on Discogs`}
                            onClick={(e) => {
                              e.stopPropagation();
                              trackEvent("artistClicked", {
                                action: "artistClicked",
                                category: "releasesTable",
                                label: "Artist Clicked",
                                value: artistUrl,
                              });
                            }}
                            className={styles.artistLink}
                          >
                            {artist.name}
                          </a>
                        ) : (
                          artist.name
                        )}
                        {index < artists.length - 1 && ", "}
                      </span>
                    );
                  })}
                </span>
                {releaseUrl ? (
                  <a
                    href={releaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.titleLink}
                    title="View release on Discogs"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEvent("releaseClicked", {
                        action: "releaseClicked",
                        category: "releasesTable",
                        label: "Release Clicked",
                        value: resourceUrl ?? releaseUrl,
                      });
                    }}
                  >
                    {title}
                  </a>
                ) : (
                  <span className={styles.titleLink}>{title}</span>
                )}
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
            const label = labels[0];
            const labelUrl = getResourceUrl({
              resourceUrl: label?.resource_url,
              type: "label",
            });

            if (!label?.name) {
              return (
                <div className={styles.labelCell}>
                  <span>Unknown</span>
                </div>
              );
            }

            return (
              <div className={styles.labelCell}>
                {labelUrl ? (
                  <a
                    href={labelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`View ${label.name} on Discogs`}
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEvent("labelClicked", {
                        action: "labelClicked",
                        category: "releasesTable",
                        label: "Label Clicked",
                        value: labelUrl,
                      });
                    }}
                    className={styles.labelLink}
                  >
                    {label.name}
                  </a>
                ) : (
                  <span>{label.name}</span>
                )}
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
        columnHelper.display({
          id: "formatStyles",
          header: "Format/Styles",
          cell: ({ row }) => {
            const releaseFormats = row.original.basic_information.formats;
            const releaseStyles = row.original.basic_information.styles;
            const formatTags =
              releaseFormats && releaseFormats.length > 0
                ? getReleaseFormatTags(releaseFormats)
                : [];

            if (
              formatTags.length === 0 &&
              (!releaseStyles || releaseStyles.length === 0)
            ) {
              return null;
            }

            return (
              <div className={styles.stylesCell}>
                {formatTags.map((formatName) => (
                  <button
                    key={formatName}
                    type="button"
                    className={classNames("pill", "pillFormat", {
                      pillSelected: selectedFormats.includes(formatName),
                    })}
                    onClick={(e) =>
                      handlePillClick({
                        event: e,
                        value: formatName,
                        type: "format",
                        eventLabel: "Format Pill Clicked",
                      })
                    }
                    aria-label={`Filter by ${formatName} format`}
                  >
                    {formatName}
                  </button>
                ))}
                {releaseStyles?.map((style: string) => (
                  <button
                    key={style}
                    type="button"
                    className={classNames("pill", "pillStyle", {
                      pillSelected: selectedStyles.includes(style),
                    })}
                    onClick={(e) =>
                      handlePillClick({
                        event: e,
                        value: style,
                        type: "style",
                        eventLabel: "Style Pill Clicked",
                      })
                    }
                    aria-label={`Filter by ${style} style`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            );
          },
          size: 180,
          enableSorting: false,
        }),
        columnHelper.display({
          id: "notes",
          header: "Notes",
          cell: ({ row }) => {
            const release = row.original;
            return (
              <div className={styles.notesCell}>
                <ReleaseNotes release={release} variant="table" />
              </div>
            );
          },
          size: 220,
          enableSorting: false,
        }),
      ],
      [
        selectedFormats,
        selectedStyles,
        handlePillClick,
        handleCheckboxChange,
        handleImageClick,
        isInCrate,
      ],
    );

    // Create a key based on actual class name values to force remount on CSS hot reload
    // This ensures React Table remounts when CSS Modules class names change
    // biome-ignore lint/correctness/useExhaustiveDependencies: We need these dependencies to detect CSS class name changes on hot reload
    const tableKey = useMemo(() => {
      return [
        styles.table,
        styles.thead,
        styles.tbody,
        styles.headerRow,
        styles.dataRow,
        styles.dataCell,
      ].join("-");
    }, [
      styles.table,
      styles.thead,
      styles.tbody,
      styles.headerRow,
      styles.dataRow,
      styles.dataCell,
    ]);

    const table = useReactTable({
      data: releases,
      columns,
      getCoreRowModel: getCoreRowModel(),
    });

    return (
      <div className={styles.tableWrapper} data-testid="fmdReleasesTable">
        <div className={styles.tableContainer}>
          <table key={tableKey} className={styles.table}>
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
                    [styles.inCrate]: isInCrate(row.original.instance_id),
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

ReleasesTable.displayName = "ReleasesTable";
