import { beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("withPrismaConnectionRetry", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("when the first attempt fails with a transient connection error, retries once", async () => {
    const { withPrismaConnectionRetry } = await import(
      "src/lib/prismaConnectionRetryExtension.server"
    );

    let calls = 0;
    const result = await withPrismaConnectionRetry(async () => {
      calls += 1;

      if (calls === 1) {
        throw new Error("Connection terminated unexpectedly");
      }

      return "ok";
    });

    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });

  it("when the error is not transient, does not retry", async () => {
    const { withPrismaConnectionRetry } = await import(
      "src/lib/prismaConnectionRetryExtension.server"
    );

    const work = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error("Unique constraint failed"));

    await expect(withPrismaConnectionRetry(work)).rejects.toThrow(
      "Unique constraint failed",
    );
    expect(work).toHaveBeenCalledTimes(1);
  });
});
