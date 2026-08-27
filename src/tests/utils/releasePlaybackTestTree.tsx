import type { ReactNode } from "react";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";

export const ReleasePlaybackTestTree = ({
  children,
}: {
  children: ReactNode;
}) => <ReleasePlaybackProvider>{children}</ReleasePlaybackProvider>;
