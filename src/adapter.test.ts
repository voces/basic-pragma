import { adapter, setAdapter, withAdapter } from "./adapter";

describe("setAdapter", () => {
  describe("methods", () => {
    it("createFrame", () => {
      expect(() => adapter.createFrame("foo", {}, {})).toThrow(
        "Adapter has not implemented createFrame",
      );

      const createFrame = jest.fn();
      setAdapter({ createFrame });
      adapter.createFrame("foo", {}, {});

      expect(createFrame).toHaveBeenCalled();
    });

    it("cleanupFrame", () => {
      expect(() => adapter.cleanupFrame("foo")).toThrow(
        "Adapter has not implemented cleanupFrame",
      );

      const cleanupFrame = jest.fn();
      setAdapter({ cleanupFrame });
      adapter.cleanupFrame({});

      expect(cleanupFrame).toHaveBeenCalled();
    });

    it("updateFrameProperties", () => {
      expect(() => adapter.updateFrameProperties("foo", {}, {})).toThrow(
        "Adapter has not implemented updateFrameProperties",
      );

      const updateFrameProperties = jest.fn();
      setAdapter({ updateFrameProperties });
      adapter.updateFrameProperties({}, {}, {});

      expect(updateFrameProperties).toHaveBeenCalled();
    });
  });

  it("clears other methods", () => {
    // Start with neither createFrame or cleanupFrame
    expect(() => adapter.createFrame("foo", {}, {})).toThrow(
      "Adapter has not implemented createFrame",
    );
    expect(() => adapter.cleanupFrame("foo")).toThrow(
      "Adapter has not implemented cleanupFrame",
    );

    // Add createFrame
    const createFrame = jest.fn();
    setAdapter({ createFrame });
    adapter.createFrame("foo", {}, {});

    expect(createFrame).toHaveBeenCalled();
    expect(() => adapter.cleanupFrame("foo")).toThrow(
      "Adapter has not implemented cleanupFrame",
    );

    // Remove createFrame and add cleanupFrame
    const cleanupFrame = jest.fn();
    setAdapter({ cleanupFrame });
    adapter.cleanupFrame({});

    expect(() => adapter.createFrame("foo", {}, {})).toThrow(
      "Adapter has not implemented createFrame",
    );
    expect(cleanupFrame).toHaveBeenCalled();
  });
});

describe("withAdapter", () => {
  it("temporarily sets adapter and then restores", () => {
    const originalCreateFrame = jest.fn();
    setAdapter({ createFrame: originalCreateFrame });
    const newCreateFrame = jest.fn().mockImplementation((type) => type);

    const ret = withAdapter(
      { createFrame: newCreateFrame },
      () => adapter.createFrame("foo", {}, {}),
    );

    expect(ret).toEqual("foo");
    expect(adapter.createFrame).toEqual(originalCreateFrame);
  });
});
