const originalError = console.error;

console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (
    msg.includes("not wrapped in act") ||
    msg.includes("not configured to support act")
  ) {
    return;
  }
  originalError.apply(console, args);
};
