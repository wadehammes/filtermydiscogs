"use client";

import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { ViewTransitionShell } from "src/components/ViewTransitionShell/ViewTransitionShell.component";

const MosaicClient = dynamic(() => import("./MosaicClient.component"), {
  ssr: false,
  loading: () => <AppPageLoading currentPage="mosaic" />,
});

export default function MosaicClientWrapper() {
  return (
    <ViewTransitionShell mode="deferredUpdate">
      <MosaicClient />
    </ViewTransitionShell>
  );
}
