import { getSiteUrl } from "src/utils/helpers";

export const EMAIL_ICON_PATH = "/email-icon.png";

export const getEmailBaseUrl = (): string => getSiteUrl().replace(/\/$/, "");

export const getEmailAssetBaseUrl = (): string => {
  const override = process.env.EMAIL_ASSET_BASE_URL?.trim();

  if (override) {
    return override.replace(/\/$/, "");
  }

  return getEmailBaseUrl();
};
