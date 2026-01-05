import { useCallback, useState } from "react";
import Button from "src/components/Button/Button.component";
import Select from "src/components/Select/Select.component";
import { useCrate } from "src/context/crate.context";
import { useCreateCrateMutation } from "src/hooks/queries/useCrateMutations";
import styles from "./CrateSelector.module.css";

interface CrateSelectorProps {
  className?: string;
}

export const CrateSelector = ({ className }: CrateSelectorProps) => {
  const { crates, activeCrateId, selectCrate, createCrate, isLoading } =
    useCrate();
  const createCrateMutation = useCreateCrateMutation();
  const [isCreating, setIsCreating] = useState(false);
  const [newCrateName, setNewCrateName] = useState("");

  const handleCrateChange = useCallback(
    (value: string | string[]) => {
      if (typeof value === "string") {
        selectCrate(value);
      }
    },
    [selectCrate],
  );

  const handleCreateCrate = useCallback(async () => {
    if (!newCrateName.trim()) {
      return;
    }

    try {
      await createCrate(newCrateName.trim());
      setNewCrateName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating crate:", error);
    }
  }, [newCrateName, createCrate]);

  const handleCancelCreate = useCallback(() => {
    setNewCrateName("");
    setIsCreating(false);
  }, []);

  const options = crates.map((crate) => {
    const releaseCount = (crate as { releaseCount?: number }).releaseCount ?? 0;
    const name = crate.is_default ? `${crate.name} (default)` : crate.name;
    return {
      value: crate.id,
      label: `${name} (${releaseCount})`,
    };
  });

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.loading}>Loading crates...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {!isCreating ? (
        <>
          <Select
            label="Select crate"
            options={options}
            value={activeCrateId || ""}
            onChange={handleCrateChange}
            placeholder="Select a crate"
            {...(styles.select ? { className: styles.select } : {})}
          />
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setIsCreating(true)}
          >
            Add New Crate
          </Button>
        </>
      ) : (
        <div className={styles.createForm}>
          <input
            type="text"
            value={newCrateName}
            onChange={(e) => setNewCrateName(e.target.value)}
            placeholder="Crate name"
            className={styles.input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateCrate();
              } else if (e.key === "Escape") {
                handleCancelCreate();
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            onPress={handleCreateCrate}
            disabled={!newCrateName.trim() || createCrateMutation.isPending}
          >
            Create
          </Button>
          <Button variant="secondary" size="sm" onPress={handleCancelCreate}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
