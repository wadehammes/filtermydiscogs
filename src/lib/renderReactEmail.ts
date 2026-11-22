import type { ReactElement } from "react";
import { render } from "react-email";

export const renderReactEmailHtmlAndText = async (
  template: ReactElement,
): Promise<{ html: string; text: string }> => {
  const [html, text] = await Promise.all([
    render(template),
    render(template, { plainText: true }),
  ]);

  return { html, text };
};
