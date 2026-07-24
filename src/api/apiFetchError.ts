export class ApiFetchError extends Error {
  readonly status: number;

  constructor(status: number, message?: string) {
    super(message ?? `HTTP error! status: ${status}`);
    this.status = status;
  }
}
