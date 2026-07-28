import type { UserPreferencesJson } from "src/types/userPreferences.types";

declare global {
  namespace PrismaJson {
    type UserPreferences = UserPreferencesJson;
  }
}
