import { useEffect, useState } from "react";
import type { DiscogsRelease } from "src/types";
import type { CrateWithCount } from "src/types/crate.types";

const STORAGE_KEY = "filtermydiscogs_selected_releases";

export function useCrateMigration(
  isAuthenticated: boolean,
  isLoading: boolean,
  crates: CrateWithCount[],
  findDefaultCrate: (args: {
    crateList: CrateWithCount[];
  }) => CrateWithCount | undefined,
  addReleaseMutation: {
    mutateAsync: (args: {
      crateId: string;
      release: DiscogsRelease;
    }) => Promise<unknown>;
  },
) {
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || isLoading || migrationDone || crates.length === 0) {
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

        const defaultCrate = findDefaultCrate({ crateList: crates });
        if (!defaultCrate) {
          setMigrationDone(true);
          return;
        }

        for (const release of parsed) {
          try {
            await addReleaseMutation.mutateAsync({
              crateId: defaultCrate.id,
              release,
            });
          } catch {
            // Continue with other releases even if one fails
          }
        }

        localStorage.removeItem(STORAGE_KEY);
        setMigrationDone(true);
      } catch {
        setMigrationDone(true);
      }
    };

    migrateLocalStorage();
  }, [
    isAuthenticated,
    isLoading,
    migrationDone,
    crates,
    addReleaseMutation,
    findDefaultCrate,
  ]);

  return migrationDone;
}
