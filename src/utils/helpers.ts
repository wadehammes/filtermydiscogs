import { isbot } from "isbot";

export const isBot = (): boolean => {
  const userAgent = isBrowser()
    ? navigator.userAgent
    : "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

  return isbot(userAgent);
};

export const isBrowser = () => {
  return Boolean(typeof window !== "undefined");
};

export const envUrl = () => {
  return process.env.NODE_ENV === "production"
    ? "https://filtermydisco.gs"
    : "http://localhost:7777";
};
