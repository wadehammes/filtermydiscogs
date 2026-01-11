"use client";

import dynamic from "next/dynamic";

const MosaicClient = dynamic(() => import("./MosaicClient.component"), {
  ssr: false,
});

/**
 * Client Component wrapper for MosaicClient.
 * Handles dynamic import with ssr: false since canvas API requires client-side rendering.
 */
export default function MosaicClientWrapper() {
  return <MosaicClient />;
}
