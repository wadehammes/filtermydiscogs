jest.mock("react-email", () =>
  jest.requireActual("src/tests/mocks/reactEmail.mock"),
);

import { BugReportSupportEmailTemplate } from "src/components/Email/BugReportSupportEmailTemplate.component";
import { definedProps } from "src/utils/definedProps";
import { render } from "test-utils";

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export class BugReportSupportEmailTemplatePO {
  renderBugReportSupportEmail(
    overrides: {
      message?: string;
      feedbackSourceTag?: string;
      username?: string;
      reporterEmail?: string;
      contactEmail?: string;
    } = {},
  ) {
    return render(
      <BugReportSupportEmailTemplate
        baseUrl="https://www.filtermydisco.gs"
        message={overrides.message ?? "Broken filters"}
        {...definedProps({
          contactEmail: overrides.contactEmail,
          feedbackSourceTag:
            overrides.feedbackSourceTag ?? "collection_command",
          reporterEmail: overrides.reporterEmail ?? "wax@example.com",
          username: overrides.username ?? "crate-digger",
        })}
      />,
    );
  }

  documentText() {
    return normalizeWhitespace(document.body.textContent ?? "");
  }
}
