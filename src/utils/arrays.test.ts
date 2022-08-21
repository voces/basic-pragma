import { getLength } from "./arrays";

describe("getLength", () => {
  it("returns 0 for empty arrays", () => {
    expect(getLength([])).toEqual(0);
  });

  it("returns 1 for ararys with 1 element", () => {
    expect(getLength([true])).toEqual(1);
  });

  it("returns 2 for ararys with 2 elements", () => {
    expect(getLength([true, true])).toEqual(2);
  });

  it("returns 1 for elements with 1 null element", () => {
    expect(getLength([null])).toEqual(1);
  });

  it("returns 2 for elements with 1 null element and a true element", () => {
    expect(getLength([null, true])).toEqual(2);
  });
});
