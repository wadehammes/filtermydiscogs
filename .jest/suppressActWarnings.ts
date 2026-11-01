const originalError = console.error;

const isSuppressedTestConsoleError = (msg: string): boolean =>
  msg.includes("not wrapped in act") ||
  msg.includes("not configured to support act") ||
  msg.includes("Failed to list public crates for static generation:") ||
  msg.includes("Failed to list public playlists for static generation:");

console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (isSuppressedTestConsoleError(msg)) {
    return;
  }
  originalError.apply(console, args);
};
