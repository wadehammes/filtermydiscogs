export type SettingsSectionId =
  | "account"
  | "appearance"
  | "playback"
  | "filters"
  | "collection"
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
    description: "Profile and sign-out",
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
    id: "data",
    label: "Data",
    description: "Stored app data",
  },
];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "account";
