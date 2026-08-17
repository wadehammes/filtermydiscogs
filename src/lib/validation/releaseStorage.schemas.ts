import { z } from "zod";

export const MAX_RELEASE_DATA_BYTES = 512_000;

export const crateReleaseStorageSchema = z
  .looseObject({
    instance_id: z.union([z.string(), z.number()]),
    basic_information: z.looseObject({
      title: z.string(),
    }),
  })
  .superRefine((value, ctx) => {
    if (!value.instance_id || String(value.instance_id).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid release data: missing instance_id",
      });
      return;
    }

    if (
      !value.basic_information ||
      typeof value.basic_information.title !== "string" ||
      value.basic_information.title.trim().length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid release data: missing basic_information",
      });
      return;
    }

    if (JSON.stringify(value).length > MAX_RELEASE_DATA_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "Release data is too large",
      });
    }
  });
