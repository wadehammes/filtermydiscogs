import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RELEASE_CARD_COVER_BLUR_SESSION_KEY } from "../src/constants/storageKeys.ts";

const RELEASE_CARD_COVER_BLUR_ATTR = "data-release-card-cover-blur";

const initSource = `(() => {
  try {
    const storageKey = "${RELEASE_CARD_COVER_BLUR_SESSION_KEY}";
    const cached = sessionStorage.getItem(storageKey);
    if (cached === "always" || cached === "hover-only") {
      document.documentElement.setAttribute("${RELEASE_CARD_COVER_BLUR_ATTR}", cached);
    }
  } catch (_e) {}
})();
`;

writeFileSync(
  join(process.cwd(), "public/release-card-cover-blur-init.js"),
  initSource,
);
