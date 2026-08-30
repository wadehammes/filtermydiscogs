"use client";

import type { ReactNode } from "react";
import styles from "./SettingsClient.module.css";

type SettingsBooleanPreferenceToggleProps = {
  checked: boolean;
  label: string;
  description: ReactNode;
  descriptionFooter?: ReactNode;
  disabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function SettingsBooleanPreferenceToggle({
  checked,
  label,
  description,
  descriptionFooter,
  disabled,
  onChange,
}: SettingsBooleanPreferenceToggleProps) {
  return (
    <div className={styles.panelBlock}>
      <label className={styles.settingToggle}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          className={styles.settingCheckbox}
        />
        <span>{label}</span>
      </label>
      <p className={styles.sectionDescription}>{description}</p>
      {descriptionFooter ? (
        <p className={styles.sectionDescription}>{descriptionFooter}</p>
      ) : null}
    </div>
  );
}
