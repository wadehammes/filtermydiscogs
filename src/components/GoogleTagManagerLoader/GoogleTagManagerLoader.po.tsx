import type { RenderResult } from "@testing-library/react";
import { GOOGLE_TAG_MANAGER_ID } from "src/constants/analytics";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  GoogleTagManagerLoader,
  GTM_SCRIPT_ID,
} from "./GoogleTagManagerLoader.component";

export class GoogleTagManagerLoaderPageObject extends BasePageObject {
  public gtmScriptId = GTM_SCRIPT_ID;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderGoogleTagManagerLoader(
    consent: "granted" | "denied" = "granted",
  ): RenderResult {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);

    return render(<GoogleTagManagerLoader />);
  }

  get expectedGtmId() {
    return GOOGLE_TAG_MANAGER_ID;
  }
}
