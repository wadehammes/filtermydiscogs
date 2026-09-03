"use client";

import {
  createColumnHelper,
  flexRender,
  useTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import classNames from "classnames";
import Image from "next/image";
import { memo, useCallback, useMemo } from "react";
import { HorizontalScrollRow } from "src/components/HorizontalScrollRow/HorizontalScrollRow.component";
import { usePlaybackPageScrollElement } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { ReleaseCrateMenu } from "src/components/ReleaseCard/ReleaseCrateMenu.component";
import { ReleaseNotes } from "src/components/ReleaseNotes/ReleaseNotes.component";
import { useCrateState } from "src/context/crate.context";
import {
  useSelectedFormats,
  useSelectedStyles,
} from "src/hooks/useFilterAtoms.hook";
import { usePillClickHandler } from "src/hooks/usePillClickHandler.hook";
import { useRegisterPlaybackPageScrollToTop } from "src/hooks/useRegisterPlaybackPageScrollToTop.hook";
import type { DiscogsRelease } from "src/types";
import { getReleaseFormatTags } from "src/utils/formatFilterTags";
import { getReleaseImageUrl, getResourceUrl } from "src/utils/helpers";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import styles from "./ReleasesTable.module.css";
import { releasesTableFeatures } from "./releasesTableFeatures";
import { useReleasesTableLayout } from "./useReleasesTableLayout.hook";

const releasesTableMountKey = [
  styles.table,
  styles.thead,
  styles.tbody,
  styles.headerRow,
  styles.dataRow,
  styles.dataCell,
].join("-");

const TABLE_ROW_ESTIMATE_PX = 80;
const TABLE_ROW_OVERSCAN = 10;

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
    const { activeCrateInstanceIds } = useCrateState();
    const selectedStyles = useSelectedStyles();
    const selectedFormats = useSelectedFormats();
    const { columnSizing, onColumnSizingChange } = useReleasesTableLayout();

    const handlePillClick = usePillClickHandler({
      onExitRandomMode,
    });

    const handleImageClick = useCallback(
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
                    actionClass={(active) =>
                      classNames(styles.crateTrigger, {
                        [styles.crateTriggerActive]: active,
                      })
                    }
                  />
                </div>
              );
            },
            size: 40,
            minSize: 40,
            maxSize: 40,
            enableResizing: false,
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
                    onClick={(event) => {
                      event.stopPropagation();
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
            minSize: 50,
            maxSize: 50,
            enableResizing: false,
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
                              onClick={(event) => {
                                event.stopPropagation();
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
                      onClick={(event) => {
                        event.stopPropagation();
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
            minSize: 160,
            maxSize: 560,
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
            minSize: 80,
            maxSize: 280,
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
            minSize: 56,
            maxSize: 120,
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
            size: 180,
            minSize: 120,
            maxSize: 360,
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
            minSize: 120,
            maxSize: 480,
          }),
        ]),
      [selectedFormats, selectedStyles, handlePillClick, handleImageClick],
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
    const columnCount = table.getAllLeafColumns().length;

    const rowVirtualizer = useVirtualizer({
      count: scrollElement ? tableRows.length : 0,
      getScrollElement: () => scrollElement,
      estimateSize: () => TABLE_ROW_ESTIMATE_PX,
      overscan: TABLE_ROW_OVERSCAN,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const useVirtualRows = scrollElement !== null && tableRows.length > 0;

    useRegisterPlaybackPageScrollToTop(rowVirtualizer, useVirtualRows);

    const paddingTop = useVirtualRows ? (virtualRows[0]?.start ?? 0) : 0;
    const paddingBottom = useVirtualRows
      ? rowVirtualizer.getTotalSize() -
        (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

    const rowsToRender = useVirtualRows
      ? virtualRows.flatMap((virtualRow) => {
          const row = tableRows[virtualRow.index];
          return row ? [{ row, key: virtualRow.key }] : [];
        })
      : tableRows.map((row) => ({ row, key: row.id }));

    return (
      <div className={styles.tableWrapper} data-testid="fmdReleasesTable">
        <div className={styles.tableContainer}>
          <table
            key={releasesTableMountKey}
            className={styles.table}
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
              {paddingTop > 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    style={{ height: paddingTop, padding: 0, border: "none" }}
                  />
                </tr>
              ) : null}
              {rowsToRender.map(({ row, key }) => (
                <tr
                  key={key}
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
              {paddingBottom > 0 ? (
                <tr>
                  <td
                    colSpan={columnCount}
                    style={{
                      height: paddingBottom,
                      padding: 0,
                      border: "none",
                    }}
                  />
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
);

ReleasesTable.displayName = "ReleasesTable";
