const userdataType = (userdata: unknown): string => {
  const typeString = (userdata as { toString: () => string }).toString();
  return typeString.slice(0, typeString.indexOf(":"));
};

export const stringify = (v: unknown, set = new WeakSet()): string => {
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "number") return v.toString();
  if (typeof v === "boolean") return v.toString();
  if (typeof v === "function") return "[function]";
  if (v == null) return "null";

  if (Array.isArray(v)) {
    if (set.has(v)) return "[cycle-arr]";
    set.add(v);

    const arr = v as Array<unknown>;

    return `[ ${arr.map((v) => stringify(v, set)).join(", ")} ]`;
  }

  if (typeof v === "object" && v != null) {
    if (set.has(v)) return "[cycle-obj]";
    set.add(v);

    return `{ ${
      Object.entries(v).map(([key, value]) =>
        `${key}: ${stringify(value, set)}`
      )
        .join(", ")
    } }`;
  }

  return `[${userdataType(v)}]`;
};
