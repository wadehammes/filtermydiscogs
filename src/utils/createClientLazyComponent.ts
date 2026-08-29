import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const createClientLazyComponent = <P extends object>(
  load: () => Promise<ComponentType<P>>,
) => dynamic(load, { ssr: false }) as ComponentType<P>;
