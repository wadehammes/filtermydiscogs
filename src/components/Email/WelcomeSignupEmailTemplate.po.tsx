jest.mock("react-email", () =>
  jest.requireActual("src/tests/mocks/reactEmail.mock"),
);

import { WelcomeSignupEmailTemplate } from "src/components/Email/WelcomeSignupEmailTemplate.component";
import { render } from "test-utils";

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export class WelcomeSignupEmailTemplatePO {
  renderWelcomeSignupEmail(username = "crate-digger") {
    return render(
      <WelcomeSignupEmailTemplate
        baseUrl="https://www.filtermydisco.gs"
        username={username}
      />,
    );
  }

  documentText() {
    return normalizeWhitespace(document.body.textContent ?? "");
  }
}
