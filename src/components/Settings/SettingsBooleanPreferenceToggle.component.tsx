"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { Checkbox } from "src/components/Checkbox/Checkbox.component";
import styles from "./SettingsClient.module.css";

type SettingsBooleanPreferenceToggleProps = {
  checked: boolean;
  label: string;
  description: ReactNode;
  descriptionFooter?: ReactNode;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
  settingId?: string;
};

export const SettingsBooleanPreferenceToggle = ({
  checked,
  label,
  description,
  descriptionFooter,
  disabled,
  onChange,
  settingId,
}: SettingsBooleanPreferenceToggleProps) => {
  const toggleInputId = useId();

  return (
    <div
      className={styles.panelBlock}
      {...(settingId ? { id: settingId } : {})}
    >
      <label className={styles.settingToggle} htmlFor={toggleInputId}>
        <Checkbox
          id={toggleInputId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onChange}
        />
        <span>{label}</span>
      </label>
      <p className={styles.sectionDescription}>{description}</p>
      {descriptionFooter ? (
        <p className={styles.sectionDescription}>{descriptionFooter}</p>
      ) : null}
    </div>
  );
};
