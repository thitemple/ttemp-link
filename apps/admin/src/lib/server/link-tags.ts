export const MAX_TAG_COUNT = 20;
export const MAX_TAG_LENGTH = 32;

export const normalizeTag = (input: string) => input.trim().toLowerCase();

export const normalizeTags = (inputs: string[]) => {
	const seen = new Set<string>();
	const normalizedTags: string[] = [];

	for (const input of inputs) {
		const tag = normalizeTag(input);
		if (!tag || seen.has(tag)) continue;
		seen.add(tag);
		normalizedTags.push(tag);
	}

	return normalizedTags;
};

export const validateTagLimits = (tags: string[]) => {
	if (tags.length > MAX_TAG_COUNT) {
		return {
			ok: false as const,
			message: `You can add up to ${MAX_TAG_COUNT} tags.`,
		};
	}

	const tooLongTag = tags.find((tag) => tag.length > MAX_TAG_LENGTH);
	if (tooLongTag) {
		return {
			ok: false as const,
			message: `Tags must be ${MAX_TAG_LENGTH} characters or less.`,
		};
	}

	return { ok: true as const };
};
