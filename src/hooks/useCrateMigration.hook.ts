import { useEffect, useState } from "react";
import { useAuth } from "src/context/auth.context";
import { useMigrateLegacyCrateMutation } from "src/hooks/mutations/useCrateMutations";
import type { DiscogsRelease } from "src/types";

const STORAGE_KEY = "filtermydiscogs_selected_releases";

export const useCrateMigration = (
  isAuthenticated: boolean,
  isLoading: boolean,
) => {
  const {
    state: { userId },
  } = useAuth();
  const { mutateAsync: migrateLegacyCrate } =
    useMigrateLegacyCrateMutation(userId);
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

        await migrateLegacyCrate(parsed);
        localStorage.removeItem(STORAGE_KEY);
        setMigrationDone(true);
      } catch {
        setMigrationDone(true);
      }
    };

    void migrateLocalStorage();
  }, [isAuthenticated, isLoading, migrateLegacyCrate, migrationDone]);

  return migrationDone;
};
