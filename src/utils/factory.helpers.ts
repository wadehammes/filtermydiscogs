import { faker } from "@faker-js/faker";

export const nullish = <T>(values: readonly T[]): T | null =>
  faker.helpers.arrayElement([null, ...values]);
