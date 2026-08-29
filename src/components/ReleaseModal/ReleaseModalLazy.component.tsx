"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ReleaseModal = dynamic(
  () =>
    import("src/components/ReleaseModal/ReleaseModal.component").then(
      (mod) => mod.ReleaseModal,
    ),
  { ssr: false },
);

type ReleaseModalLazyProps = ComponentProps<typeof ReleaseModal>;

export const ReleaseModalLazy = (props: ReleaseModalLazyProps) => (
  <ReleaseModal {...props} />
);
