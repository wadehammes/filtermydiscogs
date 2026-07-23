import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import Select from "src/components/Select/Select.component";
import { useAuth } from "src/context/auth.context";
import { useCrate } from "src/context/crate.context";
import { useCreateCrateMutation } from "src/hooks/queries/useCrateMutations";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import modalInputStyles from "src/styles/modal-input.module.css";
import styles from "./CrateSelector.module.css";

interface CrateSelectorProps {
  className?: string;
}

type EditorMode = "idle" | "create";

type CreateCrateFormValues = {
  name: string;
};

export const CrateSelector = ({ className }: CrateSelectorProps) => {
  const {
    state: { userId },
  } = useAuth();
  const {
    crates,
    activeCrateId,
    selectCrate,
    createCrate,
    isLoading,
    isUpdatingCrate,
  } = useCrate();
  const createCrateMutation = useCreateCrateMutation(userId);
  const [editorMode, setEditorMode] = useState<EditorMode>("idle");

  const { register, handleSubmit, reset, watch } =
    useForm<CreateCrateFormValues>({
      defaultValues: { name: "" },
    });

  const crateNameValue = watch("name");

  useEffect(() => {
    if (editorMode === "create") {
      reset({ name: "" });
    }
  }, [editorMode, reset]);

  const handleCrateChange = useCallback(
    (value: string | string[]) => {
      if (typeof value === "string") {
        selectCrate(value);
      }
    },
    [selectCrate],
  );

  const handleCreateCrate = handleSubmit(async ({ name }) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    try {
      await createCrate(trimmedName);
      reset({ name: "" });
      setEditorMode("idle");
    } catch {
      // Error toast is handled by useCrateMutations; keep the create form open.
    }
  });

  const handleCancelEditor = useCallback(() => {
    reset({ name: "" });
    setEditorMode("idle");
  }, [reset]);

  const handleStartCreate = useCallback(() => {
    reset({ name: "" });
    setEditorMode("create");
  }, [reset]);

  const options = crates.map((crate) => {
    const releaseCount = crate.releaseCount ?? 0;
    return {
      value: crate.id,
      label: `${crate.name} (${releaseCount})`,
      isDefault: crate.is_default,
    };
  });

  const trimmedInput = crateNameValue.trim();
  const isCreateSubmitDisabled =
    !trimmedInput || createCrateMutation.isPending || isUpdatingCrate;

  const submitLabel = createCrateMutation.isPending ? "Creating..." : "Create";

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
    <div
      className={classNames(styles.container, className)}
      data-testid="fmdCrateSelector"
    >
      {editorMode === "idle" ? (
        <>
          <Select
            label="Select crate"
            options={options}
            value={activeCrateId || ""}
            onChange={handleCrateChange}
            placeholder="Select a crate"
            className={classNames(styles.select)}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.newCrateButton}
              onClick={handleStartCreate}
              disabled={isUpdatingCrate}
              aria-label="New Crate"
            >
              <PlusIcon className={styles.newCrateIcon} aria-hidden />
            </button>
          </div>
        </>
      ) : (
        <form
          className={styles.createForm}
          onSubmit={handleCreateCrate}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCancelEditor();
            }
          }}
        >
          <input
            type="text"
            placeholder="Crate name"
            className={classNames(styles.input, modalInputStyles.field)}
            aria-label="Crate name"
            {...register("name")}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isCreateSubmitDisabled}
          >
            {submitLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onPress={handleCancelEditor}
            disabled={createCrateMutation.isPending || isUpdatingCrate}
          >
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
};
