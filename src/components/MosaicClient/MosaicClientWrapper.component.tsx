"use client";

import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";

const MosaicClient = dynamic(() => import("./MosaicClient.component"), {
  ssr: false,
  loading: () => <AppPageLoading currentPage="mosaic" />,
});

export default function MosaicClientWrapper() {
  return <MosaicClient />;
}
