import { unstable_rethrow } from "next/navigation";

export const rethrowNextInternalError = (error: unknown): void => {
  unstable_rethrow(error);
};
