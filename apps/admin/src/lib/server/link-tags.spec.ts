import { describe, expect, it } from "vitest";
import {
	MAX_TAG_COUNT,
	MAX_TAG_LENGTH,
	normalizeTag,
	normalizeTags,
	validateTagLimits,
} from "./link-tags";

describe("link-tags", () => {
	it("normalizes one tag by trimming and lowercasing", () => {
		expect(normalizeTag("  Launch  ")).toBe("launch");
	});

	it("normalizes arrays by dropping empties and deduping", () => {
		expect(normalizeTags(["  News", "", "news", "  Product  ", "product"])).toEqual([
			"news",
			"product",
		]);
	});

	it("enforces max count", () => {
		const tags = Array.from({ length: MAX_TAG_COUNT + 1 }, (_, index) => `tag-${index}`);
		expect(validateTagLimits(tags)).toEqual({
			ok: false,
			message: `You can add up to ${MAX_TAG_COUNT} tags.`,
		});
	});

	it("enforces max length", () => {
		const validTag = "ok";
		const longTag = "a".repeat(MAX_TAG_LENGTH + 1);
		expect(validateTagLimits([validTag, longTag])).toEqual({
			ok: false,
			message: `Tags must be ${MAX_TAG_LENGTH} characters or less.`,
		});
	});

	it("accepts valid tags", () => {
		expect(validateTagLimits(["engineering", "design"])).toEqual({ ok: true });
	});
});
