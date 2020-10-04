export function stringify(obj: unknown, depth = 1): string {
	if (typeof obj === "string") return `"${obj}"`;

	if (typeof obj === "function") return "<function>";

	if (typeof obj === "boolean" || typeof obj === "number") return `${obj}`;

	if (typeof obj === "undefined" || obj == null) return "nil";

	if (depth < 0) return "{ ... }";

	if (typeof obj === "object" && obj) {
		const inner = Object.keys(obj)
			.map(
				(key) =>
					`${key}: ${stringify(
						(obj as Record<string | number, unknown>)[key],
						depth - 1,
					)}`,
			)
			.join(", ");

		return `{ ${inner} }`;
	}

	throw new Error(`unknown value: ${typeof obj} ${obj}`);
}
