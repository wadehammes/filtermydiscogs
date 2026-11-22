import type {
  UserContact,
  UserContactPatch,
} from "src/types/userContact.types";

export const fetchUserContact = async (): Promise<UserContact> => {
  const response = await fetch("/api/user/contact", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const updateUserContact = async (
  patch: UserContactPatch,
): Promise<UserContact> => {
  const response = await fetch("/api/user/contact", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
