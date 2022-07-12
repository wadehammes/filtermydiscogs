import i18n, { InitOptions, use } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

const i18nOptions: InitOptions = {
  detection: {
    order: [
      "querystring",
      "path",
      "localStorage",
      "cookie",
      "sessionStorage",
      "navigator",
      "htmlTag",
      "subdomain",
    ],
    lookupQuerystring: "locale",
  },
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
  supportedLngs: ["en", "es"],
  nonExplicitSupportedLngs: true,
  fallbackLng: "en",
  preload: ["en"],
  cleanCode: true,
  load: "all",
  react: {
    useSuspense: false,
  },
};

use(LanguageDetector).use(initReactI18next).init(i18nOptions);

export default i18n;
