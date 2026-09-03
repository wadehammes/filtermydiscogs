import classNames from "classnames";
import { useCallback, useMemo, useState } from "react";
import { CreateCrateDialog } from "src/components/CreateCrateDialog/CreateCrateDialog.component";
import Select from "src/components/Select/Select.component";
import { useCrate } from "src/context/crate.context";
import type { CreateCrateFormValues } from "src/lib/validation/crate.schemas";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import styles from "./CrateSelector.module.css";

interface CrateSelectorProps {
  allowCreate?: boolean;
  className?: string;
  onNavigate?: (crateId: string) => void;
}

export const CrateSelector = ({
  allowCreate = true,
  className,
  onNavigate,
}: CrateSelectorProps) => {
  const {
    crates,
    activeCrateId,
    selectCrate,
    createCrate,
    isLoading,
    isUpdatingCrate,
    isCreatingCrate,
  } = useCrate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCrateChange = useCallback(
    (value: string | string[]) => {
      if (typeof value === "string") {
        if (onNavigate) {
          onNavigate(value);
          return;
        }

        selectCrate(value);
      }
    },
    [onNavigate, selectCrate],
  );

  const handleCreateCrate = useCallback(
    async ({ name }: CreateCrateFormValues) => {
      try {
        await createCrate(name);
        setIsCreateDialogOpen(false);
      } catch {}
    },
    [createCrate],
  );

  const options = useMemo(
    () =>
      crates.map((crate) => {
        const releaseCount = crate.releaseCount ?? 0;
        return {
          value: crate.id,
          label: `${crate.name} (${releaseCount})`,
          isDefault: crate.is_default,
        };
      }),
    [crates],
  );

  if (isLoading) {
    return (
      <div
        className={classNames(styles.container, className)}
        data-testid="fmdCrateSelector"
      >
        <div className={styles.loading}>Loading crates...</div>
      </div>
    );
  }

  return (
    <>
      <div
        className={classNames(styles.container, className)}
        data-testid="fmdCrateSelector"
      >
        <Select
          label="Select crate"
          options={options}
          value={activeCrateId || ""}
          onChange={handleCrateChange}
          placeholder="Select a crate"
          className={classNames(styles.select)}
        />
        {allowCreate ? (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.newCrateButton}
              onClick={() => {
                setIsCreateDialogOpen(true);
              }}
              disabled={isUpdatingCrate || isCreatingCrate}
              aria-label="New Crate"
            >
              <PlusIcon className={styles.newCrateIcon} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
      <CreateCrateDialog
        isOpen={isCreateDialogOpen}
        isSubmitting={isCreatingCrate}
        title="New crate"
        description="Create a crate to organize releases from your collection."
        showSetAsDefault={false}
        submitLabel="Create"
        onClose={() => {
          setIsCreateDialogOpen(false);
        }}
        onCreate={handleCreateCrate}
      />
    </>
  );
};
