"use client";

import {
  createColumnHelper,
  flexRender,
  useTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import { memo, useCallback, useMemo } from "react";
import { HorizontalScrollRow } from "src/components/HorizontalScrollRow/HorizontalScrollRow.component";
import { usePlaybackPageScrollElement } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { ReleaseCrateMenu } from "src/components/ReleaseCard/ReleaseCrateMenu.component";
import { useCrateState } from "src/context/crate.context";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import { useRegisterPlaybackPageNativeScrollToTop } from "src/hooks/useRegisterPlaybackPageScrollToTop.hook";
import textActionStyles from "src/styles/modules/text-action.module.css";
import type { DiscogsRelease } from "src/types";
import { formatDate } from "src/utils/dateHelpers";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getResourceUrl } from "src/utils/helpers";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import styles from "./ReleasesTable.module.css";
import { ReleasesTableArtistTitleCell } from "./ReleasesTableArtistTitleCell.component";
import { ReleasesTableRowActions } from "./ReleasesTableRowActions.component";
import { RELEASES_TABLE_DEFAULT_COLUMN_SIZES } from "./releasesTableColumnDefaults";
import { releasesTableFeatures } from "./releasesTableFeatures";
import { useReleasesTableLayout } from "./useReleasesTableLayout.hook";

const columnSize = (id: keyof typeof RELEASES_TABLE_DEFAULT_COLUMN_SIZES) => ({
  size: RELEASES_TABLE_DEFAULT_COLUMN_SIZES[id],
});

const releasesTableMountKey = [
  styles.table,
  styles.thead,
  styles.tbody,
  styles.headerRow,
  styles.dataRow,
  styles.dataCell,
].join("-");

interface ReleasesTableProps {
  releases: DiscogsRelease[];
  onExitRandomMode: () => void;
  onReleaseClick: (instanceId: string) => void;
}

const columnHelper = createColumnHelper<
  typeof releasesTableFeatures,
  DiscogsRelease
>();

export const ReleasesTable = memo<ReleasesTableProps>(
  ({ releases, onExitRandomMode, onReleaseClick }) => {
    "use memo";
    const { activeCrateInstanceIds } = useCrateState();
    const selectedStyles = useSelectedStyles();
    const selectedFormats = useSelectedFormats();
    const { columnSizing, onColumnSizingChange } = useReleasesTableLayout();

    const handlePillClick = usePillClickHandler({
      onExitRandomMode,
    });

    const handleReleaseOpen = useCallback(
      (release: DiscogsRelease) => {
        onReleaseClick(String(release.instance_id));
      },
      [onReleaseClick],
    );

    const columns = useMemo(
      () =>
        columnHelper.columns([
          columnHelper.display({
            id: "crate",
            header: "",
            cell: ({ row }) => {
              const release = row.original;
              return (
                <div className={styles.crateCell}>
                  <ReleaseCrateMenu
                    release={release}
                    triggerVariant="custom"
                    portaled
                    actionClass={(active) =>
                      classNames(styles.crateTrigger, {
                        [styles.crateTriggerActive]: active,
                      })
                    }
                  />
                </div>
              );
            },
            ...columnSize("crate"),
            minSize: 40,
            maxSize: 40,
            enableResizing: false,
          }),
          columnHelper.display({
            id: "artistTitle",
            header: "Artist / Title",
            cell: ({ row }) => (
              <ReleasesTableArtistTitleCell
                release={row.original}
                imagePriority={row.index < 4}
                onReleaseClick={onReleaseClick}
              />
            ),
            ...columnSize("artistTitle"),
            minSize: 180,
            maxSize: 440,
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
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                      className={textActionStyles.entitylinkprimary}
                    >
                      {label.name}
                    </a>
                  ) : (
                    <span>{label.name}</span>
                  )}
                </div>
              );
            },
            ...columnSize("label"),
            minSize: 80,
            maxSize: 280,
          }),
          columnHelper.accessor("basic_information.labels", {
            id: "catno",
            header: "Cat#",
            cell: ({ getValue }) => {
              const catno = getValue()[0]?.catno;

              return (
                <div className={styles.catnoCell}>
                  {catno ? String(catno) : "—"}
                </div>
              );
            },
            ...columnSize("catno"),
            minSize: 64,
            maxSize: 160,
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
            ...columnSize("year"),
            minSize: 56,
            maxSize: 120,
          }),
          columnHelper.accessor("date_added", {
            id: "dateAdded",
            header: "Added",
            cell: ({ getValue }) => {
              const dateAdded = getValue();
              const formatted = dateAdded ? formatDate(dateAdded) : "";

              return (
                <div className={styles.dateAddedCell}>
                  {formatted ? (
                    <time
                      dateTime={dateAdded}
                      title={`Added to collection ${formatted}`}
                    >
                      {formatted}
                    </time>
                  ) : (
                    "—"
                  )}
                </div>
              );
            },
            ...columnSize("dateAdded"),
            minSize: 72,
            maxSize: 140,
          }),
          columnHelper.display({
            id: "formatStyles",
            header: "Format/Styles",
            cell: ({ row }) => {
              const { formats: releaseFormats } =
                row.original.basic_information;
              const formatTags =
                releaseFormats && releaseFormats.length > 0
                  ? getReleaseFormatTags(releaseFormats)
                  : [];
              const genreStyleTags = getReleaseGenreStyleTags(
                row.original.basic_information,
              );

              if (formatTags.length === 0 && genreStyleTags.length === 0) {
                return null;
              }

              return (
                <div className={styles.stylesCell}>
                  <HorizontalScrollRow className={styles.tagsRow}>
                    {formatTags.map((formatName) => (
                      <button
                        key={formatName}
                        type="button"
                        className={classNames("pill", "pillFormat", {
                          pillSelected: selectedFormats.includes(formatName),
                        })}
                        onClick={(event) =>
                          handlePillClick({
                            event,
                            value: formatName,
                            type: "format",
                          })
                        }
                        aria-label={`Filter by ${formatName} format`}
                      >
                        {formatName}
                      </button>
                    ))}
                    {genreStyleTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={classNames("pill", "pillStyle", {
                          pillSelected: selectedStyles.includes(tag),
                        })}
                        onClick={(event) =>
                          handlePillClick({
                            event,
                            value: tag,
                            type: "style",
                          })
                        }
                        aria-label={`Filter by ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </HorizontalScrollRow>
                </div>
              );
            },
            ...columnSize("formatStyles"),
            minSize: 180,
            maxSize: 480,
          }),
          columnHelper.display({
            id: "actions",
            header: "",
            cell: ({ row }) => (
              <ReleasesTableRowActions
                release={row.original}
                onReleaseClick={handleReleaseOpen}
              />
            ),
            ...columnSize("actions"),
            minSize: 120,
            maxSize: 120,
            enableResizing: false,
          }),
        ]),
      [
        selectedFormats,
        selectedStyles,
        handlePillClick,
        handleReleaseOpen,
        onReleaseClick,
      ],
    );

    const table = useTable({
      features: releasesTableFeatures,
      data: releases,
      columns,
      state: {
        columnSizing,
      },
      onColumnSizingChange,
      columnResizeMode: "onChange",
      enableColumnResizing: true,
    });

    const scrollElement = usePlaybackPageScrollElement();
    const tableRows = table.getRowModel().rows;

    useRegisterPlaybackPageNativeScrollToTop(scrollElement);

    return (
      <div className={styles.tableWrapper} data-testid="fmdReleasesTable">
        <div className={styles.tableContainer}>
          <table
            key={releasesTableMountKey}
            className={styles.table}
            aria-label="Collection releases"
            style={{ minWidth: table.getTotalSize() }}
          >
            <thead className={styles.thead}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={styles.headerRow}>
                  {headerGroup.headers.map((header) => {
                    const { column } = header;

                    return (
                      <th
                        key={header.id}
                        className={classNames(styles.headerCell, {
                          [styles.isResizing]: column.getIsResizing(),
                        })}
                        style={{ width: header.getSize() }}
                      >
                        <div className={styles.headerInner}>
                          <div className={styles.headerLabel}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </div>
                          {column.getCanResize() && (
                            <button
                              type="button"
                              aria-label={`Resize ${column.id} column`}
                              className={classNames(styles.resizeHandle, {
                                [styles.resizeHandleActive]:
                                  column.getIsResizing(),
                              })}
                              onDoubleClick={() => {
                                column.resetSize();
                              }}
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                            />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className={styles.tbody}>
              {tableRows.map((row) => (
                <tr
                  key={String(row.original.instance_id)}
                  className={classNames(styles.dataRow, {
                    [styles.inCrate]: activeCrateInstanceIds.has(
                      String(row.original.instance_id),
                    ),
                  })}
                >
                  {row.getAllCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={classNames(styles.dataCell, {
                        [styles.formatStylesCell]:
                          cell.column.id === "formatStyles",
                        [styles.actionsCell]: cell.column.id === "actions",
                      })}
                      style={{ width: cell.column.getSize() }}
                    >
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
