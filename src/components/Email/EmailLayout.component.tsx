import type { ReactNode } from "react";
import { Body, Container, Head, Html, Preview, Tailwind } from "react-email";
import { emailClasses } from "src/components/Email/emailClasses";
import { emailTailwindConfig } from "src/components/Email/emailTheme";

type EmailLayoutProps = {
  preview: string;
  title?: string;
  children: ReactNode;
};

export const EmailLayout = ({ preview, title, children }: EmailLayoutProps) => {
  const documentTitle = title ?? preview;

  return (
    <Html lang="en">
      <Head>
        <title>{documentTitle}</title>
        <meta content="light dark" name="color-scheme" />
        <meta content="light dark" name="supported-color-schemes" />
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind config={emailTailwindConfig}>
        <Body className={emailClasses.body}>
          <Container className={emailClasses.container}>{children}</Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
