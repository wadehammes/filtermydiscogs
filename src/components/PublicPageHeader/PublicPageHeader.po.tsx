import type { RenderResult } from "@testing-library/react";
import type { ComponentProps, ReactElement } from "react";
import { PublicPageHeader } from "src/components/PublicPageHeader/PublicPageHeader.component";
import { BasePageObject } from "src/tests/BasePageObject.po";
import { render } from "test-utils";

export type PublicPageHeaderRenderProps = Partial<
  ComponentProps<typeof PublicPageHeader>
>;

export class PublicPageHeaderPageObject extends BasePageObject {
  readonly testId = "fmdPublicPageHeader";

  private renderUi(overrides: PublicPageHeaderRenderProps = {}): ReactElement {
    return <PublicPageHeader currentPage="home" {...overrides} />;
  }

  renderPublicPageHeader(
    overrides: PublicPageHeaderRenderProps = {},
  ): RenderResult {
    return render(this.renderUi(overrides));
  }
}
