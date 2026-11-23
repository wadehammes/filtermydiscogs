jest.mock("react-email", () =>
  jest.requireActual("src/tests/mocks/reactEmail.mock"),
);

import { WelcomeSignupEmailTemplate } from "src/components/Email/WelcomeSignupEmailTemplate.component";
import { definedProps } from "src/utils/definedProps";
import { render } from "test-utils";

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export class WelcomeSignupEmailTemplatePO {
  renderWelcomeSignupEmail(username = "crate-digger", contactEmail?: string) {
    return render(
      <WelcomeSignupEmailTemplate
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
