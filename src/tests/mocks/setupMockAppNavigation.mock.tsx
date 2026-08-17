"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";

const mockUseRouter = jest.mocked(useRouter);
const mockUsePathname = jest.mocked(usePathname);
const mockUseSearchParams = jest.mocked(useSearchParams);

export function AppNavigationTestRoot({
  children,
  initialUrl = "/",
}: {
  children: ReactNode;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const actionsRef = useRef<{
    push: (nextUrl: string) => void;
    replace: (nextUrl: string) => void;
  } | null>(null);

  if (actionsRef.current === null) {
    const navigate = (nextUrl: string) => {
      flushSync(() => {
        setUrl(nextUrl);
      });
    };

    actionsRef.current = {
      push: jest.fn(navigate),
      replace: jest.fn(navigate),
    };
  }

  const { push, replace } = actionsRef.current;

  const queryIndex = url.indexOf("?");
  const pathname = queryIndex >= 0 ? url.slice(0, queryIndex) : url;
  const searchParams =
    queryIndex >= 0
      ? new URLSearchParams(url.slice(queryIndex + 1))
      : new URLSearchParams();

  mockUsePathname.mockReturnValue(pathname);
  mockUseSearchParams.mockReturnValue(
    searchParams as ReturnType<typeof useSearchParams>,
  );
  mockUseRouter.mockReturnValue(
    createMockAppRouter({
      push,
      replace,
    }),
  );

  return <div key={url}>{children}</div>;
}
