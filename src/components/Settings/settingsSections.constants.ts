import { SETTINGS_DATA_SECTION_NAV_DESCRIPTION } from "src/constants/settingsCopy.constants";

export type SettingsSectionId =
  | "account"
  | "appearance"
  | "playback"
  | "filters"
  | "collection"
  | "support"
  | "data";

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  description: string;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "account",
    label: "Account",
    description: "Profile and email",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme and default view",
  },
  {
    id: "playback",
    label: "Playback",
    description: "Queue and player behavior",
  },
  {
    id: "filters",
    label: "Filters",
    description: "Saved views and filter preferences",
  },
  {
    id: "collection",
    label: "Collection",
    description: "Crate sync tools",
  },
  {
    id: "support",
    label: "Donate",
    description: "One-time donations",
  },
  {
    id: "data",
    label: "Privacy",
    description: SETTINGS_DATA_SECTION_NAV_DESCRIPTION,
  },
];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "account";

export const SETTINGS_PLAYBACK_EXTEND_QUEUE_SIMILAR_SETTING_ID =
  "settings-extend-queue-similar";

export const buildSettingsSectionHref = (
  sectionId: SettingsSectionId,
  hash?: string,
): string => {
  const base = `/settings?section=${sectionId}`;
  return hash ? `${base}#${hash}` : base;
};

export const SETTINGS_PLAYBACK_QUEUE_TAIL_HREF = buildSettingsSectionHref(
  "playback",
  SETTINGS_PLAYBACK_EXTEND_QUEUE_SIMILAR_SETTING_ID,
);
