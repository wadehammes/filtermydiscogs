export async function messageFromFailedApiResponse(
  response: Response,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: unknown;
      details?: unknown;
    };
    if (typeof data?.error === "string" && data.error.length > 0) {
      return data.error;
    }
    if (typeof data?.details === "string" && data.details.length > 0) {
      return data.details;
    }
  } catch {
    return `HTTP error! status: ${response.status}`;
  }
  return `HTTP error! status: ${response.status}`;
}

export async function parseSuccessResponse<T>(response: Response): Promise<T> {
  const bodyText = await response.text();
  if (!bodyText.trim()) {
    return { success: true } as T;
  }

  return JSON.parse(bodyText) as T;
}
