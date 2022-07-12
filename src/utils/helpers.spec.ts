import { randomDecFromInterval, randomIntFromInterval } from "./helpers";

describe("randomIntFromInterval", () => {
  it("generated integer is between the two provided integers", () => {
    const lowerBound = 0;
    const upperBound = 10;
    const randomInteger = randomIntFromInterval(lowerBound, upperBound);

    expect(randomInteger).toBeGreaterThanOrEqual(lowerBound);
    expect(randomInteger).toBeLessThanOrEqual(upperBound);
    expect(Number.isInteger(randomInteger)).toBe(true);
  });
});

describe("randomDecFromInterval", () => {
  it("generated number w/ decimal is between the two provided numbers", () => {
    const lowerBound = 1;
    const upperBound = 2.5;
    const randomInteger = randomDecFromInterval(lowerBound, upperBound);

    expect(randomInteger).toBeGreaterThanOrEqual(lowerBound);
    expect(randomInteger).toBeLessThanOrEqual(upperBound);
    expect(randomInteger.toString().indexOf(".") === 1).toBe(true);
  });
});
