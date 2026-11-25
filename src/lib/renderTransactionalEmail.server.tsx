import "server-only";

import type { ReactElement } from "react";
import { renderReactEmailHtmlAndText } from "src/lib/renderReactEmail";

export type RenderedTransactionalEmail = {
  subject: string;
  html: string;
  text: string;
};

export const renderTransactionalEmail = async (
  subject: string,
  template: ReactElement,
): Promise<RenderedTransactionalEmail> => {
  const { html, text } = await renderReactEmailHtmlAndText(template);

  return { subject, html, text };
};
