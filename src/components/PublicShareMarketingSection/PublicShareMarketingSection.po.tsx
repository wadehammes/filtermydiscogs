import type { RenderResult } from "@testing-library/react";
import { BasePageObject } from "src/tests/BasePageObject.po";
import {
  TestProviders,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render } from "test-utils";
import { PublicShareMarketingSection } from "./PublicShareMarketingSection.component";

export class PublicShareMarketingSectionPageObject extends BasePageObject {
  public testId = "fmdPublicShareMarketingSection";

  renderPublicShareMarketingSection(): RenderResult {
    return render(<PublicShareMarketingSection />, {
      wrapper: ({ children }) => (
        <TestProviders
          authInitialState={testUnauthenticatedAuthState}
          includeCollectionSync={false}
        >
          {children}
        </TestProviders>
      ),
    });
  }
}
