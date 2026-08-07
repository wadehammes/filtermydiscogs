"use client";

import { useId } from "react";
import { ModalToolbar } from "src/components/shared/ModalToolbar/ModalToolbar.component";
import { ScrollModal } from "src/components/shared/ScrollModal/ScrollModal.component";
import type { DuplicateGroup } from "src/types/dashboard.types";
import { definedProps } from "src/utils/definedProps";
import styles from "./DuplicatesDetailModal.module.css";
import { DuplicatesList } from "./DuplicatesList.component";

interface DuplicatesDetailModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  duplicateGroups: DuplicateGroup[];
  onClose: () => void;
  onReleaseClick?: (instanceId: string) => void;
}

export function DuplicatesDetailModal({
  isOpen,
  title,
  description,
  duplicateGroups,
  onClose,
  onReleaseClick,
}: DuplicatesDetailModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <ScrollModal
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      isOpen={isOpen}
      onClose={onClose}
      testId="fmdDuplicatesDetailModal"
      header={
        <>
          <ModalToolbar onClose={onClose} title={title} titleId={titleId} />
          <p className={styles.description} id={descriptionId}>
            {description}
          </p>
        </>
      }
    >
      <DuplicatesList
        duplicateGroups={duplicateGroups}
        {...definedProps({ onReleaseClick })}
      />
    </ScrollModal>
  );
}
