import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";

export function ensureResponseErrorPolyfill(): void {
  if (typeof Response === "undefined") {
    return;
  }

  if (typeof Response.error === "function") {
    return;
  }

  Response.error = () => new Response(null, { status: 0, statusText: "" });
}

ensureResponseErrorPolyfill();

if (typeof globalThis.WritableStream === "undefined") {
  globalThis.WritableStream =
    WritableStream as typeof globalThis.WritableStream;
}

if (typeof globalThis.ReadableStream === "undefined") {
  globalThis.ReadableStream =
    ReadableStream as typeof globalThis.ReadableStream;
}

if (typeof globalThis.TransformStream === "undefined") {
  globalThis.TransformStream =
    TransformStream as typeof globalThis.TransformStream;
}

if (typeof globalThis.BroadcastChannel === "undefined") {
  class BroadcastChannelPolyfill extends EventTarget {
    readonly name: string;

    onmessage: ((this: BroadcastChannel, ev: MessageEvent) => unknown) | null =
      null;

    onmessageerror:
      | ((this: BroadcastChannel, ev: MessageEvent) => unknown)
      | null = null;

    constructor(name: string) {
      super();
      this.name = name;
    }

    postMessage(_message: unknown) {}

    close() {}
  }

  globalThis.BroadcastChannel =
    BroadcastChannelPolyfill as typeof globalThis.BroadcastChannel;
}
