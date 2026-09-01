import { useEffect, useSyncExternalStore } from "react";

const mountedStore = {
  _value: false,
  _listeners: new Set<() => void>(),
  subscribe(cb: () => void) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  },
  getSnapshot() {
    return this._value;
  },
  setMounted() {
    if (!this._value) {
      this._value = true;
      this._listeners.forEach((cb) => {
        cb();
      });
    }
  },
};

export function useMounted() {
  const mounted = useSyncExternalStore(
    (cb) => mountedStore.subscribe(cb),
    () => mountedStore.getSnapshot(),
    () => false,
  );
  useEffect(() => {
    mountedStore.setMounted();
  }, []);
  return mounted;
}

export const resetMountedStoreForTests = () => {
  mountedStore._value = false;
};
