"use client";

import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

export const CrateDrawerLazy = createClientLazyComponent(() =>
  import("src/components/CrateDrawer/CrateDrawer.component").then(
    (mod) => mod.CrateDrawer,
  ),
);
