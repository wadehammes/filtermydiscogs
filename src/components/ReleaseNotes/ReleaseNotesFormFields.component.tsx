"use client";

import classNames from "classnames";
import Select from "src/components/Select/Select.component";
import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import modalInputStyles from "src/styles/modules/modal-input.module.css";
import type { DiscogsCollectionField } from "src/types";
import styles from "./ReleaseNotesFormFields.module.css";

export const getNoteFieldLabelId = (fieldId: number) =>
  `note-field-label-${fieldId}`;

export const CONDITION_NOT_SET_VALUE = "";

export const getConditionSelectOptions = (field: DiscogsCollectionField) => {
  return [
    { value: CONDITION_NOT_SET_VALUE, label: "Not set" },
    ...(field.options ?? []).map((option) => ({
      value: option,
      label: option,
    })),
  ];
};

interface ReleaseNotesFormFieldsProps {
  textFields: DiscogsCollectionField[];
  conditionFields: DiscogsCollectionField[];
  values: Record<string, string>;
  disabled?: boolean;
  layout?: "default" | "modal";
  onTextFieldChange?: (
    fieldId: number,
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onTextFieldFocus?: (fieldId: number) => void;
  onTextFieldBlur?: (fieldId: number) => void;
  onConditionFieldChange?: (fieldId: number, value: string) => void;
  textFieldErrors?: Record<string, { message?: string } | undefined>;
}

export const ReleaseNotesFormFields = ({
  textFields,
  conditionFields,
  values,
  disabled = false,
  layout = "default",
  onTextFieldChange,
  onTextFieldFocus,
  onTextFieldBlur,
  onConditionFieldChange,
  textFieldErrors = {},
}: ReleaseNotesFormFieldsProps) => {
  const isModalLayout = layout === "modal";

  return (
    <div className={classNames(isModalLayout && styles.modalLayout)}>
      {textFields.map((field) => {
        const fieldKey = String(field.id);
        const fieldValue = values[fieldKey] ?? "";
        const fieldLength = fieldValue.length;
        const fieldError = textFieldErrors[fieldKey];
        const isFieldOverLimit = fieldLength > COLLECTION_NOTE_MAX_LENGTH;

        return (
          <div className={styles.fieldGroup} key={field.id}>
            <label
              className={styles.label}
              htmlFor={`note-field-${field.id}`}
              id={getNoteFieldLabelId(field.id)}
            >
              {field.name}
            </label>
            <textarea
              id={`note-field-${field.id}`}
              className={classNames(
                styles.textarea,
                modalInputStyles.field,
                (fieldError || isFieldOverLimit) && styles.textareaInvalid,
              )}
              disabled={disabled}
              maxLength={COLLECTION_NOTE_MAX_LENGTH}
              value={fieldValue}
              aria-describedby={`note-field-${field.id}-length`}
              aria-invalid={fieldError || isFieldOverLimit ? true : undefined}
              onChange={(event) => onTextFieldChange?.(field.id, event)}
              onFocus={() => onTextFieldFocus?.(field.id)}
              onBlur={() => onTextFieldBlur?.(field.id)}
            />
            <div className={styles.fieldFooter}>
              {fieldError ? (
                <p className={styles.fieldError} role="alert">
                  {fieldError.message}
                </p>
              ) : (
                <span className={styles.fieldFooterSpacer} aria-hidden />
              )}
              <p
                id={`note-field-${field.id}-length`}
                className={classNames(
                  styles.charCount,
                  isFieldOverLimit && styles.charCountLimit,
                )}
              >
                {fieldLength} / {COLLECTION_NOTE_MAX_LENGTH}
              </p>
            </div>
          </div>
        );
      })}

      {conditionFields.length > 0 ? (
        <div
          className={classNames(
            styles.conditionFields,
            isModalLayout && styles.conditionFieldsModal,
          )}
        >
          {conditionFields.map((field) => {
            const fieldKey = String(field.id);
            const fieldValue = values[fieldKey] ?? "";

            return (
              <Select
                key={field.id}
                className={styles.conditionSelect}
                disabled={disabled}
                label={field.name}
                showLabel
                options={getConditionSelectOptions(field)}
                placeholder="Not set"
                value={fieldValue}
                onChange={(value) => {
                  if (typeof value === "string") {
                    onConditionFieldChange?.(field.id, value);
                  }
                }}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
