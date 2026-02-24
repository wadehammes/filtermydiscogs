const noop = () => {};
const asyncNoop = (cb: (blob: Blob | null) => void) =>
  setTimeout(() => cb(new Blob()), 0);

const createMockContext = () => ({
  fillRect: noop,
  strokeRect: noop,
  clearRect: noop,
  drawImage: noop,
  fillText: noop,
  strokeText: noop,
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  arc: noop,
  fill: noop,
  stroke: noop,
  closePath: noop,
  save: noop,
  restore: noop,
  translate: noop,
  scale: noop,
  rotate: noop,
  setTransform: noop,
  getImageData: () => ({ data: new Uint8ClampedArray(0), width: 0, height: 0 }),
  putImageData: noop,
  createLinearGradient: () => ({ addColorStop: noop }),
  createRadialGradient: () => ({ addColorStop: noop }),
  createPattern: () => null,
  measureText: () => ({ width: 0 }),
  canvas: { width: 0, height: 0, getContext: () => null, toBlob: asyncNoop },
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  font: "",
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
  imageSmoothingEnabled: true,
  imageSmoothingQuality: "low",
  lineCap: "butt",
  lineDashOffset: 0,
  lineJoin: "miter",
  miterLimit: 10,
  shadowBlur: 0,
  shadowColor: "",
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  textAlign: "start",
  textBaseline: "alphabetic",
});

(HTMLCanvasElement.prototype.getContext as (
  contextId: string,
) => RenderingContext | null) = (contextId: string) => {
  if (contextId === "2d") {
    return createMockContext() as unknown as CanvasRenderingContext2D;
  }
  return null;
};

(HTMLCanvasElement.prototype.toBlob as (
  callback: (blob: Blob | null) => void,
) => void) = (callback: (blob: Blob | null) => void) => {
  asyncNoop(callback);
};
