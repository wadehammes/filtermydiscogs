import { config } from "zod";

export const configureBrowserZod = (): void => {
  config({ jitless: true });
};
