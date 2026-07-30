import type { RenderResult } from "@testing-library/react";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { CookieConsentBanner } from "./CookieConsentBanner.component";

export class CookieConsentBannerPageObject extends BasePageObject {
  public testId = "fmdCookieConsentBanner";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderCookieConsentBanner(): RenderResult {
    localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);

    return render(<CookieConsentBanner />);
  }
}
