import { AsyncLocalStorage } from "node:async_hooks";

import type { DiscogsThrottleCaller } from "src/constants/discogsThrottleCaller.constants";

const callerContext = new AsyncLocalStorage<DiscogsThrottleCaller>();

export const getDiscogsThrottleCaller = (): DiscogsThrottleCaller | undefined =>
  callerContext.getStore();

export const runWithDiscogsThrottleCaller = <T>(
  caller: DiscogsThrottleCaller,
  work: () => Promise<T>,
): Promise<T> => callerContext.run(caller, work);
