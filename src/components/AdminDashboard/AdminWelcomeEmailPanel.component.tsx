"use client";

import {
  createColumnHelper,
  flexRender,
  useTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import dashboardStyles from "src/components/AdminDashboard/AdminDashboardClient.module.css";
import { DashboardSection } from "src/components/Dashboard/DashboardSection.component";
import { useSendAdminWelcomeEmailMutation } from "src/hooks/mutations/useSendAdminWelcomeEmailMutation";
import { useAdminWelcomeEmailPendingQuery } from "src/hooks/queries/useAdminWelcomeEmailPendingQuery";
import type { AdminWelcomeEmailPendingUser } from "src/types/adminWelcomeEmail.types";
import { buildDiscogsUserProfileUrl } from "src/utils/discogsUserProfileUrl";
import styles from "./AdminWelcomeEmailPanel.module.css";
import { adminWelcomeEmailTableFeatures } from "./adminWelcomeEmailTableFeatures";

const formatTimestamp = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatUserLabel = (row: AdminWelcomeEmailPendingUser): ReactNode => (
  <a
    className={dashboardStyles.tableUserLink}
    href={buildDiscogsUserProfileUrl(row.username)}
    rel="noopener noreferrer"
    target="_blank"
  >
    {row.username}{" "}
    <span className={dashboardStyles.tableUserMeta}>({row.discogsUserId})</span>
  </a>
);

const columnHelper = createColumnHelper<
  typeof adminWelcomeEmailTableFeatures,
  AdminWelcomeEmailPendingUser
>();

const queueColumnCount = 5;

const queueCellClassName = (columnId: string): string | undefined => {
  switch (columnId) {
    case "createdAt":
      return styles.signedUpCell;
    case "email":
      return styles.emailCell;
    case "loginCount":
      return styles.loginsCell;
    case "send":
      return styles.sendCell;
    default:
      return undefined;
  }
};

interface AdminWelcomeEmailPanelProps {
  enabled: boolean;
}

export const AdminWelcomeEmailPanel = ({
  enabled,
}: AdminWelcomeEmailPanelProps) => {
  const { data, error, isFetching, refetch } =
    useAdminWelcomeEmailPendingQuery(enabled);
  const {
    mutate,
    isPending,
    variables: sendingUserId,
  } = useSendAdminWelcomeEmailMutation();
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  const rows = data?.users ?? [];

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "username",
          header: "User",
          cell: ({ row }) => formatUserLabel(row.original),
        }),
        columnHelper.accessor("email", {
          header: "Email",
          cell: ({ getValue }) => (
            <span className={styles.emailCell}>{getValue()}</span>
          ),
        }),
        columnHelper.accessor("createdAt", {
          header: "Signed up",
          cell: ({ getValue }) => (
            <span className={styles.signedUpCell}>
              {formatTimestamp(getValue())}
            </span>
          ),
        }),
        columnHelper.accessor("loginCount", {
          header: "Logins",
          cell: ({ getValue }) => (
            <span className={styles.loginsCell}>{getValue()}</span>
          ),
        }),
        columnHelper.display({
          id: "send",
          header: "Send",
          cell: ({ row }) => {
            const { discogsUserId } = row.original;
            const isSending = isPending && sendingUserId === discogsUserId;

            return (
              <button
                className={styles.sendButton}
                disabled={isSending}
                onClick={() => {
                  setSendErrorMessage(null);
                  mutate(discogsUserId, {
                    onError: (sendFailure) => {
                      setSendErrorMessage(sendFailure.message);
                    },
                    onSuccess: () => {
                      setSendErrorMessage(null);
                    },
                  });
                }}
                type="button"
              >
                {isSending ? "Sending…" : "Send"}
              </button>
            );
          },
        }),
      ]),
    [isPending, mutate, sendingUserId],
  );

  const table = useTable({
    columns,
    data: rows,
    features: adminWelcomeEmailTableFeatures,
    getRowId: (row) => String(row.discogsUserId),
  });

  const tableRows = table.getRowModel().rows;

  return (
    <DashboardSection
      id="welcome-email"
      lede="Post-rollout accounts with a saved email who have not received the one-time welcome note yet. Send manually when automatic delivery missed."
      title="Welcome email queue"
    >
      <article className={styles.panel}>
        <div className={styles.toolbar}>
          <p className={styles.meta}>
            {isFetching
              ? "Loading queue…"
              : `${rows.length} account${rows.length === 1 ? "" : "s"} pending`}
          </p>
          <button
            className={styles.refreshButton}
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
            type="button"
          >
            Refresh
          </button>
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error.message}
          </p>
        ) : null}

        {sendErrorMessage ? (
          <p className={styles.error} role="alert">
            {sendErrorMessage}
          </p>
        ) : null}

        <div className={styles.tableContainer}>
          <table
            aria-label="Welcome email queue"
            className={styles.queueTable}
            data-testid="fmdAdminWelcomeEmailQueueTable"
          >
            <colgroup>
              <col className={styles.colUser} />
              <col className={styles.colEmail} />
              <col className={styles.colSignedUp} />
              <col className={styles.colLogins} />
              <col className={styles.colSend} />
            </colgroup>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={queueCellClassName(header.column.id)}
                      scope="col"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td className={styles.emptyTable} colSpan={queueColumnCount}>
                    No pending welcome emails
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={classNames(
                          queueCellClassName(cell.column.id),
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </DashboardSection>
  );
};
