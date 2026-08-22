const memoryStore = new Map<string, unknown>();

function dispatchRequestSuccess<T>(request: {
  result: T;
  onsuccess: ((event: Event) => void) | null;
}): void {
  queueMicrotask(() => {
    request.onsuccess?.({ target: request } as unknown as Event);
  });
}

function createObjectStore() {
  return {
    get: (key: string) => {
      const request = {
        result: memoryStore.get(key),
        error: null as DOMException | null,
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      dispatchRequestSuccess(request);
      return request;
    },
    put: (value: unknown, key: string) => {
      memoryStore.set(key, value);
      const request = {
        result: undefined,
        error: null as DOMException | null,
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      dispatchRequestSuccess(request);
      return request;
    },
    delete: (key: string) => {
      memoryStore.delete(key);
      const request = {
        result: undefined,
        error: null as DOMException | null,
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      dispatchRequestSuccess(request);
      return request;
    },
    clear: () => {
      memoryStore.clear();
      const request = {
        result: undefined,
        error: null as DOMException | null,
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
      };
      dispatchRequestSuccess(request);
      return request;
    },
  };
}

export function installMockIndexedDb(): void {
  const database = {
    objectStoreNames: {
      contains: () => true,
    },
    createObjectStore: () => createObjectStore(),
    transaction: (_storeName: string, _mode: IDBTransactionMode) => {
      const transaction = {
        error: null as DOMException | null,
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        objectStore: () => createObjectStore(),
      };

      queueMicrotask(() => {
        transaction.oncomplete?.();
      });

      return transaction;
    },
    close: () => {},
    onversionchange: null as (() => void) | null,
  } as unknown as IDBDatabase;

  const openRequest = {
    result: database,
    error: null as DOMException | null,
    onsuccess: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    onupgradeneeded: null as ((event: IDBVersionChangeEvent) => void) | null,
  };

  global.indexedDB = {
    open: () => {
      queueMicrotask(() => {
        openRequest.onupgradeneeded?.({
          target: openRequest,
        } as unknown as IDBVersionChangeEvent);
        openRequest.onsuccess?.({ target: openRequest } as unknown as Event);
      });
      return openRequest as unknown as IDBOpenDBRequest;
    },
  } as unknown as IDBFactory;
}

export function resetMockIndexedDb(): void {
  memoryStore.clear();
}

export function readMockIndexedDbEntry(key: string): unknown {
  return memoryStore.get(key);
}
