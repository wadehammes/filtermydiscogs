export const sanitizeMosaicFilePrefix = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "mosaic";
};

export const buildMosaicExportFileName = (
  imageFormat: "jpeg" | "png",
  fileNamePrefix?: string,
): string => {
  const date = new Date().toISOString().split("T")[0];
  const extension = imageFormat === "png" ? "png" : "jpg";
  const base = fileNamePrefix
    ? sanitizeMosaicFilePrefix(fileNamePrefix)
    : "discogs-mosaic";

  return `${base}-${date}.${extension}`;
};
