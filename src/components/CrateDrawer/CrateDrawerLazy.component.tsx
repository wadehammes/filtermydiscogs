"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const CrateDrawer = dynamic(
  () =>
    import("src/components/CrateDrawer/CrateDrawer.component").then(
      (mod) => mod.CrateDrawer,
    ),
  { ssr: false },
);

type CrateDrawerLazyProps = ComponentProps<typeof CrateDrawer>;

export const CrateDrawerLazy = (props: CrateDrawerLazyProps) => (
  <CrateDrawer {...props} />
);
