jest.mock("react-email", () =>
  jest.requireActual("src/tests/mocks/reactEmail.mock"),
);

import { BugReportReceivedEmailTemplate } from "src/components/Email/BugReportReceivedEmailTemplate.component";
import { definedProps } from "src/utils/definedProps";
import { render } from "test-utils";

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export class BugReportReceivedEmailTemplatePO {
  renderBugReportReceivedEmail(
    username = "crate-digger",
    contactEmail?: string,
  ) {
    return render(
      <BugReportReceivedEmailTemplate
        {...definedProps({
          baseUrl: "https://www.filtermydisco.gs",
          ...(contactEmail ? { contactEmail } : {}),
          username,
        })}
      />,
    );
  }

  documentText() {
    return normalizeWhitespace(document.body.textContent ?? "");
  }
}
