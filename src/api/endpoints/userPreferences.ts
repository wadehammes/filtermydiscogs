import type {
  UserPreferences,
  UserPreferencesPatch,
} from "src/types/userPreferences.types";

export const fetchUserPreferences = async (): Promise<{
  preferences: UserPreferences;
}> => {
  const response = await fetch("/api/user/preferences", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const updateUserPreferences = async (
  patch: UserPreferencesPatch,
): Promise<{
  preferences: UserPreferences;
}> => {
  const response = await fetch("/api/user/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
