"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import dashboardStyles from "src/components/AdminDashboard/AdminDashboardClient.module.css";
import { AdminMetricTable } from "src/components/AdminDashboard/AdminMetricTable.component";
import { DashboardSection } from "src/components/Dashboard/DashboardSection.component";
import { useSendAdminWelcomeEmailMutation } from "src/hooks/mutations/useSendAdminWelcomeEmailMutation";
import { useAdminWelcomeEmailPendingQuery } from "src/hooks/queries/useAdminWelcomeEmailPendingQuery";
import type { AdminWelcomeEmailPendingUser } from "src/types/adminWelcomeEmail.types";
import { buildDiscogsUserProfileUrl } from "src/utils/discogsUserProfileUrl";
import styles from "./AdminWelcomeEmailPanel.module.css";

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

        <AdminMetricTable
          columns={[
            {
              key: "username",
              header: "User",
              render: (row) => formatUserLabel(row),
            },
            {
              key: "email",
              header: "Email",
              render: (row) => (
                <span className={styles.emailCell}>{row.email}</span>
              ),
            },
            {
              key: "createdAt",
              header: "Signed up",
              align: "metric",
              render: (row) => formatTimestamp(row.createdAt),
            },
            {
              key: "loginCount",
              header: "Logins",
              align: "metric",
            },
            {
              key: "discogsUserId",
              header: "Send",
              align: "metric",
              render: (row) => (
                <button
                  className={styles.sendButton}
                  disabled={isPending && sendingUserId === row.discogsUserId}
                  onClick={() => {
                    setSendErrorMessage(null);
                    mutate(row.discogsUserId, {
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
                  {isPending && sendingUserId === row.discogsUserId
                    ? "Sending…"
                    : "Send"}
                </button>
              ),
            },
          ]}
          emptyMessage="No pending welcome emails"
          getRowKey={(row) => String(row.discogsUserId)}
          rows={rows}
        />
      </article>
    </DashboardSection>
  );
};
