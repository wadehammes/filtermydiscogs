export class ApiFetchError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `HTTP error! status: ${status}`);
    this.status = status;
  }
}

export const getApiFetchErrorStatus = (error: unknown): number | null => {
  if (error instanceof ApiFetchError) {
    return error.status;
  }

  return null;
};
