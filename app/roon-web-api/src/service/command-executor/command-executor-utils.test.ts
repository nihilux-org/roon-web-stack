import { awaitAll } from "./command-executor-utils";

describe("command-executor-utils test suite", () => {
  it("awaitAll should return T[] if all promises go fine", async () => {
    const values = ["first", "second", "third"];
    const promises = values.map((v) => Promise.resolve(v));
    const awaited = await awaitAll(promises);
    expect(awaited).toEqual(values);
  });
  it("awaitAll should concat all error reason in a rejected Promise if ant Error happens", async () => {
    const values = ["first", "second", "third"];
    const promises = values.map((v, index) => {
      if (index % 2 === 0) {
        return Promise.reject(new Error(v));
      } else {
        return Promise.resolve(v);
      }
    });
    try {
      await awaitAll(promises);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("first\nthird");
    }
  });
});
