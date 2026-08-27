export const fetchBuildVersion = async (): Promise<{ version: string }> => {
  const response = await fetch("/api/build-version", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const payload = (await response.json()) as { version?: string };

  if (typeof payload.version !== "string") {
    throw new Error("Invalid build version response");
  }

  return { version: payload.version };
};
