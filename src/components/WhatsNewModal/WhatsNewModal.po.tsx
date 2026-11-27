import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { WhatsNewModal } from "./WhatsNewModal.component";

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
