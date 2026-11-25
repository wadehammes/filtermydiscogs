jest.mock("react-email", () =>
  jest.requireActual("src/tests/mocks/reactEmail.mock"),
);

import { UserEmailVerificationEmailTemplate } from "src/components/Email/UserEmailVerificationEmailTemplate.component";
import { definedProps } from "src/utils/definedProps";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

const defaultConfirmUrl =
  "https://www.filtermydisco.gs/api/user/email-verification/confirm?token=test";

export class UserEmailVerificationEmailTemplatePO {
  renderUserEmailVerificationEmail(contactEmail?: string): RenderResult {
    return render(
      <UserEmailVerificationEmailTemplate
        {...definedProps({
          baseUrl: "https://www.filtermydisco.gs",
          confirmUrl: defaultConfirmUrl,
          ...(contactEmail ? { contactEmail } : {}),
        })}
      />,
    );
  }

  documentText(): string {
    return normalizeWhitespace(document.body.textContent ?? "");
  }
}