import { describe, expect, it, jest } from "@jest/globals";
import { lookupTrackDjMetadata } from "src/lib/getsongbpm.server";

describe("lookupTrackDjMetadata", () => {
  it("returns tempo and key from a matched song lookup", async () => {
    process.env.GETSONGBPM_API_KEY = "test-key";

    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          search: [
            {
              id: "abc123",
              title: "Blue Monday",
              name: "New Order",
              tempo: "130",
              key: "7A",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await lookupTrackDjMetadata({
      id: "1",
      artist: "New Order",
      title: "Blue Monday",
    });

    expect(result).toEqual({ bpm: 130, key: "7A" });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockRestore();
    delete process.env.GETSONGBPM_API_KEY;
  });
});
