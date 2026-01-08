/**
 * Formats a date string to a readable format (e.g., "Jan 15, 2024")
 * @param dateString - The date string to format
 * @returns Formatted date string or empty string if invalid
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};
