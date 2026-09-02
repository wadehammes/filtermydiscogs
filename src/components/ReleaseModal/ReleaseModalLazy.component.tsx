"use client";

import { loadReleaseModal } from "src/components/ReleaseModal/releaseModalLoader";
import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

export const ReleaseModalLazy = createClientLazyComponent(loadReleaseModal);
