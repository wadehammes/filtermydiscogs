import type { ReactNode } from "react";

type EmailElementProps = {
  children?: ReactNode;
  className?: string;
  href?: string;
};

export const Html = ({ children }: EmailElementProps) => (
  <div data-testid="email-html">{children}</div>
);

export const Head = ({ children }: EmailElementProps) => <>{children}</>;

export const Preview = () => null;

export const Body = ({ children, className }: EmailElementProps) => (
  <div className={className}>{children}</div>
);

export const Container = ({ children, className }: EmailElementProps) => (
  <div className={className}>{children}</div>
);

export const Tailwind = ({ children }: EmailElementProps) => <>{children}</>;

export const Section = ({ children, className }: EmailElementProps) => (
  <section className={className}>{children}</section>
);

export const Text = ({ children, className }: EmailElementProps) => (
  <p className={className}>{children}</p>
);

export const Heading = ({ children, className }: EmailElementProps) => (
  <h1 className={className}>{children}</h1>
);

export const Link = ({ children, className, href }: EmailElementProps) => (
  <a className={className} href={href}>
    {children}
  </a>
);

export const Img = ({
  alt = "",
  className,
  src,
}: EmailElementProps & { alt?: string; src?: string }) => (
  <div
    aria-label={alt || undefined}
    className={className}
    data-src={src}
    data-testid="email-img"
    role="img"
  />
);

export const Button = ({ children, className, href }: EmailElementProps) => (
  <a className={className} href={href}>
    {children}
  </a>
);

export const Hr = () => <hr />;
