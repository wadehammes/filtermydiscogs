import type { Prisma } from "@prisma/client";

export const toPrismaJsonValue = (value: unknown): Prisma.JsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.JsonValue;

export const toPrismaInputJsonValue = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
