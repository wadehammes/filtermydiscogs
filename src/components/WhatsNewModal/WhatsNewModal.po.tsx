import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { buildWhatsNewModalTestReleases } from "src/tests/factories/WhatsNewRelease.factory";
import { render } from "test-utils";
import { WhatsNewModal } from "./WhatsNewModal.component";

jest.mock("src/constants/whatsNew.constants", () => {
  const actual = jest.requireActual<
    typeof import("src/constants/whatsNew.constants")
  >("src/constants/whatsNew.constants");

  return {
    ...actual,
    WHATS_NEW_RELEASES: buildWhatsNewModalTestReleases(),
  };
});

export class WhatsNewModalPageObject extends BasePageObject {
  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderWhatsNewModal(
    props: Partial<{ isOpen: boolean; onClose: () => void }> = {},
  ): RenderResult {
    const onClose = props.onClose ?? jest.fn();

    return render(
      <WhatsNewModal isOpen={props.isOpen ?? true} onClose={onClose} />,
    );
  }
}
