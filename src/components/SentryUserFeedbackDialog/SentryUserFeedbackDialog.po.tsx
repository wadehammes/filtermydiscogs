import type { Attachment } from "@sentry/core";
import type { RenderResult } from "@testing-library/react";
import type { SentryUserFeedbackFormValues } from "src/lib/validation/sentryUserFeedback.schemas";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { SentryUserFeedbackDialog } from "./SentryUserFeedbackDialog.component";

export type SentryUserFeedbackDialogRenderProps = {
  open?: boolean;
  defaultName?: string;
  onClose?: () => void;
  onSubmitFeedback?: (
    values: SentryUserFeedbackFormValues,
    screenshot?: Attachment,
  ) => void;
  onCaptureScreenshot?: () => Promise<Attachment | undefined>;
  screenshotCaptureSupported?: boolean;
};

export class SentryUserFeedbackDialogPageObject extends BasePageObject {
  public testId = "fmdSentryUserFeedbackDialog";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private SentryUserFeedbackDialogElement(
    overrides: SentryUserFeedbackDialogRenderProps = {},
  ) {
    const {
      open,
      defaultName,
      onClose,
      onSubmitFeedback,
      onCaptureScreenshot,
      screenshotCaptureSupported,
    } = overrides;

    return (
      <SentryUserFeedbackDialog
        defaultName={defaultName ?? ""}
        open={open ?? true}
        onClose={onClose ?? jest.fn()}
        onSubmitFeedback={onSubmitFeedback ?? jest.fn()}
        {...(onCaptureScreenshot ? { onCaptureScreenshot } : {})}
        {...(screenshotCaptureSupported !== undefined
          ? { screenshotCaptureSupported }
          : {})}
      />
    );
  }

  renderSentryUserFeedbackDialog(
    overrides: SentryUserFeedbackDialogRenderProps = {},
  ): RenderResult {
    return render(this.SentryUserFeedbackDialogElement(overrides));
  }

  rerenderSentryUserFeedbackDialog(
    rerender: RenderResult["rerender"],
    overrides: SentryUserFeedbackDialogRenderProps = {},
  ): void {
    rerender(this.SentryUserFeedbackDialogElement(overrides));
  }
}
