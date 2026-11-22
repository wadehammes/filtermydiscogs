export const parseDiscogsProfileEmail = (profile: {
  email?: unknown;
}): string | null => {
  if (typeof profile.email !== "string") {
    return null;
  }

  const trimmed = profile.email.trim();
  if (!trimmed.includes("@")) {
    return null;
  }

  return trimmed;
};
