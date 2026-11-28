export const parsePlaybackDockBarCollapsed = (stored: string | null): boolean => {
  if (stored === null) {
    return false;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    return parsed === true;
  } catch {
    return false;
  }
};
