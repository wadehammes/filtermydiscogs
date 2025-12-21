"use client";

import dynamic from "next/dynamic";
import AuthLoading from "src/components/AuthLoading/AuthLoading.component";

const MosaicClient = dynamic(() => import("./MosaicClient.component"), {
  loading: () => <AuthLoading />,
  ssr: false,
});

/**
 * Client Component wrapper for MosaicClient.
 * Handles dynamic import with ssr: false since canvas API requires client-side rendering.
 */
export default function MosaicClientWrapper() {
  return <MosaicClient />;
}
