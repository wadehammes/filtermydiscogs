import {
  ReadableStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";

if (typeof Response !== "undefined" && typeof Response.error !== "function") {
  Response.error = () => new Response(null, { status: 0, statusText: "" });
}

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
