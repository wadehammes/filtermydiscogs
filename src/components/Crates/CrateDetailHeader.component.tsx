"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { api } from "src/api/urls";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateSelector } from "src/components/CrateSelector/CrateSelector.component";
import { useAuth } from "src/context/auth.context";
import { CrateQueryKeys } from "src/hooks/queries/querykeys.constants";
import { CrateDetailActionsMenu } from "./CrateDetailActionsMenu.component";
import styles from "./CrateDetailClient.module.css";

export const CrateDetailHeader = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();
  const { activeCrateId } = useCrateDrawerContext();

  const handleCrateNavigate = useCallback(
    async (nextCrateId: string) => {
      if (userId) {
        await queryClient.query({
          queryKey: CrateQueryKeys.byUserAndId(userId, nextCrateId),
          queryFn: () => api.crate(nextCrateId),
        });
      }

      router.replace(`/crates/${nextCrateId}`, { scroll: false });
    },
    [queryClient, router, userId],
  );

  return (
    <header className={styles.masthead}>
      <Link href="/crates" className={styles.backLink}>
        ← All crates
      </Link>

      <div className={styles.mastheadControls}>
        <CrateSelector
          allowCreate={false}
          className={styles.crateSelector}
          onNavigate={handleCrateNavigate}
        />

        {activeCrateId ? <CrateDetailActionsMenu /> : null}
      </div>
    </header>
  );
};
