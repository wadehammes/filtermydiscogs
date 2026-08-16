import type { ReactNode } from "react";
import styles from "./AdminDashboardClient.module.css";

export interface AdminMetricTableColumn<T> {
  key: keyof T & string;
  header: string;
  align?: "name" | "metric";
  render?: (row: T) => ReactNode;
}

interface AdminMetricTableProps<T> {
  columns: AdminMetricTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowKey: (row: T) => string;
}

export const AdminMetricTable = <T,>({
  columns,
  rows,
  emptyMessage = "No data",
  getRowKey,
}: AdminMetricTableProps<T>) => (
  <div className={styles.tableContainer}>
    <table className={styles.table}>
      <colgroup>
        {columns.map((column) => (
          <col
            className={
              column.align === "metric"
                ? styles.tableMetricCol
                : styles.tableNameCol
            }
            key={column.key}
          />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              className={
                column.align === "metric"
                  ? styles.tableMetricCol
                  : styles.tableNameCol
              }
              key={column.key}
              scope="col"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td className={styles.emptyTable} colSpan={columns.length}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td
                  className={
                    column.align === "metric"
                      ? styles.tableMetricCol
                      : styles.tableNameCol
                  }
                  key={column.key}
                >
                  {column.render
                    ? column.render(row)
                    : String(row[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
