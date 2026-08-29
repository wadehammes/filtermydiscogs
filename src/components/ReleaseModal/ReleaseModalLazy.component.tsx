"use client";

import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

export const ReleaseModalLazy = createClientLazyComponent(() =>
  import("src/components/ReleaseModal/ReleaseModal.component").then(
    (mod) => mod.ReleaseModal,
  ),
);
