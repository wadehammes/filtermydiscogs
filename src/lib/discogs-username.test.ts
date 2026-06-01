import { isValidDiscogsUsername } from "./discogs-username";

describe("isValidDiscogsUsername", () => {
  it("accepts letters, numbers, underscore, hyphen, and period", () => {
    expect(isValidDiscogsUsername("testuser")).toBe(true);
    expect(isValidDiscogsUsername("user_name")).toBe(true);
    expect(isValidDiscogsUsername("user-name")).toBe(true);
    expect(isValidDiscogsUsername("user.name")).toBe(true);
    expect(isValidDiscogsUsername("Dr.Who")).toBe(true);
  });

  it("rejects invalid characters and overlong usernames", () => {
    expect(isValidDiscogsUsername("user name")).toBe(false);
    expect(isValidDiscogsUsername("user@name")).toBe(false);
    expect(isValidDiscogsUsername("a".repeat(51))).toBe(false);
  });
});
