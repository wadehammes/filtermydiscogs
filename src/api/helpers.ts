export enum FetchMethods {
  Get = "GET",
  Post = "POST",
}

export interface FetchOptions {
  body?: string;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
  method?: FetchMethods;
}

export const fetchOptions = ({
  body,
  cache,
  credentials = "include",
  headers,
  method = FetchMethods.Get,
}: FetchOptions = {}): RequestInit => {
  const init: RequestInit = {
    credentials,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    method,
  };

  if (body !== undefined) {
    init.body = body;
  }

  if (cache !== undefined) {
    init.cache = cache;
  }

  return init;
};

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: string,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export const fetchResponse = async <T>(
  endpoint: Promise<Response>,
): Promise<T> => {
  const response = await endpoint;

  if (!response.ok) {
    const body = await response.text();
    throw new FetchError(
      `Fetch failed: ${response.status} ${response.statusText}`,
      response.status,
      body,
    );
  }

  return response.json() as Promise<T>;
};
