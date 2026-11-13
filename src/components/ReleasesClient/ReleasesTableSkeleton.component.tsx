"use client";

import classNames from "classnames";
import { useState } from "react";
import tableStyles from "src/components/ReleasesTable/ReleasesTable.module.css";
import {
  getReleasesTableColumnWidth,
  getReleasesTableTotalWidth,
  RELEASES_TABLE_COLUMN_IDS,
  type ReleasesTableColumnId,
} from "src/components/ReleasesTable/releasesTableColumnDefaults";
import { readReleasesTableLayout } from "src/components/ReleasesTable/useReleasesTableLayout.hook";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import styles from "./ReleasesTableSkeleton.module.css";

const pulseSurface = skeletonPulseStyles.pulsesurface;

const TABLE_SKELETON_ROW_COUNT = 12;

const HEADER_LABEL_WIDTH: Partial<Record<ReleasesTableColumnId, string>> = {
  artistTitle: styles.headerBarWide,
  formatStyles: styles.headerBarWide,
};

const TEXT_CELL_WIDTH: Partial<Record<ReleasesTableColumnId, string>> = {
  label: styles.textBarMedium,
  catno: styles.textBarNarrow,
  year: styles.textBarNarrow,
  dateAdded: styles.textBarMedium,
};

const columnWidthStyle = (
  columnId: ReleasesTableColumnId,
  columnSizing: ReturnType<typeof readReleasesTableLayout>["columnSizing"],
) => ({
  width: getReleasesTableColumnWidth(columnId, columnSizing),
});

export const ReleasesTableSkeleton = () => {
  const [{ columnSizing }] = useState(readReleasesTableLayout);
  const tableMinWidth = getReleasesTableTotalWidth(columnSizing);

  return (
    <div
      className={styles.root}
      data-testid="fmdReleasesTableSkeleton"
      aria-hidden
    >
      <div className={tableStyles.tableWrapper}>
        <div className={tableStyles.tableContainer}>
          <table
            className={tableStyles.table}
            role="presentation"
            style={{ minWidth: tableMinWidth }}
          >
            <thead className={tableStyles.thead}>
              <tr className={tableStyles.headerRow}>
                {RELEASES_TABLE_COLUMN_IDS.map((columnId) => (
                  <th
                    key={columnId}
                    className={tableStyles.headerCell}
                    style={columnWidthStyle(columnId, columnSizing)}
                  >
                    <div className={tableStyles.headerInner}>
                      <div className={tableStyles.headerLabel}>
                        {columnId !== "crate" && columnId !== "actions" ? (
                          <div
                            className={classNames(
                              styles.headerBar,
                              HEADER_LABEL_WIDTH[columnId],
                              pulseSurface,
                            )}
                          />
                        ) : null}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {Array.from(
                { length: TABLE_SKELETON_ROW_COUNT },
                (_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={tableStyles.dataRow}
                    data-testid="fmdReleasesTableSkeletonRow"
                  >
                    <td
                      className={tableStyles.dataCell}
                      style={columnWidthStyle("crate", columnSizing)}
                    >
                      <div className={tableStyles.crateCell}>
                        <div
                          className={classNames(
                            styles.cratePulse,
                            pulseSurface,
                          )}
                        />
                      </div>
                    </td>
                    <td
                      className={tableStyles.dataCell}
                      style={columnWidthStyle("artistTitle", columnSizing)}
                    >
                      <div className={tableStyles.artistTitleCell}>
                        <div
                          className={classNames(
                            styles.thumbPulse,
                            pulseSurface,
                          )}
                        />
                        <div className={tableStyles.artistTitleText}>
                          <div
                            className={classNames(
                              styles.textBar,
                              styles.textBarArtist,
                              pulseSurface,
                            )}
                          />
                          <div
                            className={classNames(
                              styles.textBar,
                              styles.textBarTitle,
                              pulseSurface,
                            )}
                          />
                        </div>
                      </div>
                    </td>
                    <td
                      className={tableStyles.dataCell}
                      style={columnWidthStyle("label", columnSizing)}
                    >
                      <div className={tableStyles.labelCell}>
                        <div
                          className={classNames(
                            styles.textBar,
                            TEXT_CELL_WIDTH.label,
                            pulseSurface,
                          )}
                        />
                      </div>
                    </td>
                    <td
                      className={tableStyles.dataCell}
                      style={columnWidthStyle("catno", columnSizing)}
                    >
                      <div className={tableStyles.catnoCell}>
                        <div
                          className={classNames(
                            styles.textBar,
                            TEXT_CELL_WIDTH.catno,
                            pulseSurface,
                          )}
                        />
                      </div>
                    </td>
                    <td
                      className={tableStyles.dataCell}
                      style={columnWidthStyle("year", columnSizing)}
                    >
                      <div className={tableStyles.yearCell}>
                        <div
                          className={classNames(
                            styles.textBar,
                            TEXT_CELL_WIDTH.year,
                            pulseSurface,
                          )}
                        />
                      </div>
                    </td>
                    <td
                      className={tableStyles.dataCell}
                      style={columnWidthStyle("dateAdded", columnSizing)}
                    >
                      <div className={tableStyles.dateAddedCell}>
                        <div
                          className={classNames(
                            styles.textBar,
                            TEXT_CELL_WIDTH.dateAdded,
                            pulseSurface,
                          )}
                        />
                      </div>
                    </td>
                    <td
                      className={classNames(
                        tableStyles.dataCell,
                        tableStyles.formatStylesCell,
                      )}
                      style={columnWidthStyle("formatStyles", columnSizing)}
                    >
                      <div className={tableStyles.stylesCell}>
                        <div className={styles.tagsPulse}>
                          <div
                            className={classNames(
                              styles.pillPulse,
                              pulseSurface,
                            )}
                          />
                          <div
                            className={classNames(
                              styles.pillPulseWide,
                              pulseSurface,
                            )}
                          />
                          <div
                            className={classNames(
                              styles.pillPulse,
                              pulseSurface,
                            )}
                          />
                        </div>
                      </div>
                    </td>
                    <td
                      className={classNames(
                        tableStyles.dataCell,
                        tableStyles.actionsCell,
                      )}
                      style={columnWidthStyle("actions", columnSizing)}
                    >
                      <div
                        className={classNames(
                          styles.actionsPulse,
                          pulseSurface,
                        )}
                      />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
