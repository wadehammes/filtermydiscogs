import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  DiscogsExternalLink,
  type DiscogsExternalLinkProps,
} from "./DiscogsExternalLink.component";

export type DiscogsExternalLinkRenderProps = Partial<DiscogsExternalLinkProps>;

export class DiscogsExternalLinkPageObject extends BasePageObject {
  public testId = "fmdDiscogsExternalLink";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private DiscogsExternalLinkElement(
    overrides: DiscogsExternalLinkRenderProps = {},
  ) {
    return (
      <DiscogsExternalLink
        href="https://www.discogs.com/release/1"
        variant="text"
        {...overrides}
      />
    );
  }

  renderDiscogsExternalLink(
    overrides: DiscogsExternalLinkRenderProps = {},
  ): RenderResult {
    return render(this.DiscogsExternalLinkElement(overrides));
  }
}
