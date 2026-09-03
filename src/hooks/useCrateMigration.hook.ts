import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "src/api/urls";
import { useAuth } from "src/context/auth.context";
import {
  CrateQueryKeys,
  CratesQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type { DiscogsRelease } from "src/types";

const STORAGE_KEY = "filtermydiscogs_selected_releases";

export function useCrateMigration(
  isAuthenticated: boolean,
  isLoading: boolean,
) {
  const queryClient = useQueryClient();
  const {
    state: { userId },
  } = useAuth();
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || isLoading || migrationDone) {
      return;
    }

    const migrateLocalStorage = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setMigrationDone(true);
          return;
        }

        const parsed = JSON.parse(stored) as DiscogsRelease[];
        if (!Array.isArray(parsed) || parsed.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
          setMigrationDone(true);
          return;
        }

        await api.migrateLegacyCrate(parsed);
        localStorage.removeItem(STORAGE_KEY);

        if (userId) {
          await queryClient.invalidateQueries({
            queryKey: CratesQueryKeys.byUserId(userId),
          });
          await queryClient.invalidateQueries({
            queryKey: CrateQueryKeys.byUserId(userId),
          });
        }

        setMigrationDone(true);
      } catch {
        setMigrationDone(true);
      }
    };

    void migrateLocalStorage();
  }, [isAuthenticated, isLoading, migrationDone, queryClient, userId]);

  return migrationDone;
}
