"use client";

import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import Select from "src/components/Select/Select.component";
import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import type { ReleaseNotesFormValues } from "src/lib/validation/releaseNotes.schemas";
import modalInputStyles from "src/styles/modules/modal-input.module.css";
import type { DiscogsCollectionField } from "src/types";
import { definedProps } from "src/utils/definedProps";
import {
  getInitialActiveTextFieldId,
  getReleaseNotesTextFieldPickerOptions,
  parseReleaseNotesTextFieldPickerValue,
  RELEASE_NOTES_TEXT_FIELD_PICKER_LABEL,
  sortTextCollectionFields,
} from "src/utils/releaseNotes";
import { validatedFieldClass } from "src/utils/validatedFieldClass";
import styles from "./ReleaseNotesFormFields.module.css";

export const getNoteFieldLabelId = (fieldId: number) =>
  `note-field-label-${fieldId}`;

export const CONDITION_NOT_SET_VALUE = "";

export type ReleaseNotesTextFieldSaveStatus = "idle" | "pending" | "saved";

const getTextFieldSaveStatusLabel = (
  status: ReleaseNotesTextFieldSaveStatus | undefined,
): string | null => {
  if (status === "pending") {
    return "Saving…";
  }

  if (status === "saved") {
    return "Saved";
  }

  return null;
};

export const getReleaseNotesTextFieldError = (
  errors: Record<string, { message?: unknown } | undefined>,
  fieldKey: string,
): { message?: string } | undefined => {
  const message = errors[fieldKey]?.message;

  if (typeof message === "string") {
    return { message };
  }

  return undefined;
};

export const getConditionSelectOptions = (field: DiscogsCollectionField) => {
  return [
    { value: CONDITION_NOT_SET_VALUE, label: "Not set" },
    ...(field.options ?? []).map((option) => ({
      value: option,
      label: option,
    })),
  ];
};

interface ReleaseNotesTextFieldEditorProps {
  field: DiscogsCollectionField;
  fieldValue: string;
  disabled: boolean;
  fieldError?: { message?: string };
  statusLabel: string | null;
  showVisibleLabel: boolean;
  onTextFieldChange?: (
    fieldId: number,
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onTextFieldFocus?: (fieldId: number) => void;
  onTextFieldBlur?: (fieldId: number) => void;
}

const ReleaseNotesTextFieldEditor = ({
  field,
  fieldValue,
  disabled,
  fieldError,
  statusLabel,
  showVisibleLabel,
  onTextFieldChange,
  onTextFieldFocus,
  onTextFieldBlur,
}: ReleaseNotesTextFieldEditorProps) => {
  const fieldLength = fieldValue.length;
  const isFieldOverLimit = fieldLength > COLLECTION_NOTE_MAX_LENGTH;

  return (
    <div className={styles.fieldGroup}>
      {showVisibleLabel ? (
        <label
          className={styles.label}
          htmlFor={`note-field-${field.id}`}
          id={getNoteFieldLabelId(field.id)}
        >
          {field.name}
        </label>
      ) : null}
      <textarea
        data-1p-ignore
        id={`note-field-${field.id}`}
        className={validatedFieldClass(
          styles.textarea,
          modalInputStyles.textarea,
          (fieldError || isFieldOverLimit) && styles.textareaInvalid,
        )}
        disabled={disabled}
        maxLength={COLLECTION_NOTE_MAX_LENGTH}
        value={fieldValue}
        aria-label={field.name}
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
        <div className={styles.fieldFooterTrailing}>
          {statusLabel ? (
            <p className={styles.saveStatus} aria-live="polite">
              {statusLabel}
            </p>
          ) : null}
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
    </div>
  );
};

interface ReleaseNotesFormFieldsProps {
  textFields: DiscogsCollectionField[];
  conditionFields: DiscogsCollectionField[];
  disabled?: boolean;
  layout?: "default" | "modal";
  onTextFieldChange?: (
    fieldId: number,
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onTextFieldFocus?: (fieldId: number) => void;
  onTextFieldBlur?: (fieldId: number) => void;
  onConditionFieldChange?: (fieldId: number, value: string) => void;
  textFieldSaveStatus?: Record<string, ReleaseNotesTextFieldSaveStatus>;
}

export const ReleaseNotesFormFields = ({
  textFields,
  conditionFields,
  disabled = false,
  layout = "default",
  onTextFieldChange,
  onTextFieldFocus,
  onTextFieldBlur,
  onConditionFieldChange,
  textFieldSaveStatus = {},
}: ReleaseNotesFormFieldsProps) => {
  const { setValue, watch, formState } =
    useFormContext<ReleaseNotesFormValues>();
  const values = watch();
  const { errors } = formState;

  const isModalLayout = layout === "modal";
  const sortedTextFields = useMemo(
    () => sortTextCollectionFields(textFields),
    [textFields],
  );
  const hasMultipleTextFields = sortedTextFields.length > 1;
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const [activeTextFieldId, setActiveTextFieldId] = useState(() =>
    getInitialActiveTextFieldId(sortedTextFields, values),
  );

  useEffect(() => {
    setActiveTextFieldId((currentFieldId) => {
      if (
        currentFieldId !== undefined &&
        sortedTextFields.some((field) => field.id === currentFieldId)
      ) {
        return currentFieldId;
      }

      return getInitialActiveTextFieldId(sortedTextFields, valuesRef.current);
    });
  }, [sortedTextFields]);

  const textFieldPickerOptions = useMemo(
    () => getReleaseNotesTextFieldPickerOptions(sortedTextFields, values),
    [sortedTextFields, values],
  );

  const handleTextFieldPickerChange = useCallback(
    (value: string | string[]) => {
      const nextFieldId = parseReleaseNotesTextFieldPickerValue(value);

      if (nextFieldId === null) {
        return;
      }

      if (activeTextFieldId !== undefined) {
        onTextFieldBlur?.(activeTextFieldId);
      }

      setActiveTextFieldId(nextFieldId);
      onTextFieldFocus?.(nextFieldId);
    },
    [activeTextFieldId, onTextFieldBlur, onTextFieldFocus],
  );

  const handleTextFieldChange = useCallback(
    (fieldId: number, event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onTextFieldChange) {
        onTextFieldChange(fieldId, event);
        return;
      }

      setValue(String(fieldId), event.target.value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [onTextFieldChange, setValue],
  );

  const handleConditionFieldChange = useCallback(
    (fieldId: number, value: string) => {
      if (onConditionFieldChange) {
        onConditionFieldChange(fieldId, value);
        return;
      }

      setValue(String(fieldId), value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [onConditionFieldChange, setValue],
  );

  const activeTextField =
    sortedTextFields.find((field) => field.id === activeTextFieldId) ??
    sortedTextFields[0];

  return (
    <div
      className={classNames(
        styles.formFieldsLayout,
        isModalLayout && styles.modalLayout,
      )}
    >
      {hasMultipleTextFields ? (
        <>
          <Select
            className={styles.conditionSelect}
            disabled={disabled}
            label={RELEASE_NOTES_TEXT_FIELD_PICKER_LABEL}
            showLabel
            options={textFieldPickerOptions}
            {...definedProps({
              value:
                activeTextFieldId !== undefined
                  ? String(activeTextFieldId)
                  : undefined,
            })}
            onChange={handleTextFieldPickerChange}
          />
          {activeTextField ? (
            <ReleaseNotesTextFieldEditor
              key={activeTextField.id}
              field={activeTextField}
              fieldValue={values[String(activeTextField.id)] ?? ""}
              disabled={disabled}
              {...definedProps({
                fieldError: getReleaseNotesTextFieldError(
                  errors,
                  String(activeTextField.id),
                ),
              })}
              statusLabel={getTextFieldSaveStatusLabel(
                textFieldSaveStatus[String(activeTextField.id)],
              )}
              showVisibleLabel={false}
              onTextFieldChange={handleTextFieldChange}
              {...definedProps({
                onTextFieldFocus,
                onTextFieldBlur,
              })}
            />
          ) : null}
        </>
      ) : (
        sortedTextFields.map((field) => {
          const fieldKey = String(field.id);
          const fieldValue = values[fieldKey] ?? "";

          return (
            <ReleaseNotesTextFieldEditor
              key={field.id}
              field={field}
              fieldValue={fieldValue}
              disabled={disabled}
              {...definedProps({
                fieldError: getReleaseNotesTextFieldError(errors, fieldKey),
              })}
              statusLabel={getTextFieldSaveStatusLabel(
                textFieldSaveStatus[fieldKey],
              )}
              showVisibleLabel
              onTextFieldChange={handleTextFieldChange}
              {...definedProps({
                onTextFieldFocus,
                onTextFieldBlur,
              })}
            />
          );
        })
      )}

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
                    handleConditionFieldChange(field.id, value);
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
