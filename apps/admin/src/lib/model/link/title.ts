export const MAX_LINK_TITLE_LENGTH = 96;

const NAMED_HTML_ENTITY_MAP: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

export const limitLinkTitle = (value: string, maxLength = MAX_LINK_TITLE_LENGTH) =>
	value.length <= maxLength ? value : value.slice(0, maxLength).trimEnd();

export const decodeHtmlEntities = (value: string) =>
	value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, token: string) => {
		const lowered = token.toLowerCase();
		if (lowered in NAMED_HTML_ENTITY_MAP) {
			return NAMED_HTML_ENTITY_MAP[lowered]!;
		}

		if (lowered.startsWith("#x")) {
			const codePoint = Number.parseInt(lowered.slice(2), 16);
			return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
		}

		if (lowered.startsWith("#")) {
			const codePoint = Number.parseInt(lowered.slice(1), 10);
			return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
		}

		return entity;
	});

export const normalizeLinkTitle = (
	value: string | null | undefined,
	maxLength = MAX_LINK_TITLE_LENGTH,
) => {
	if (!value) return null;
	const decoded = decodeHtmlEntities(value);
	const cleaned = normalizeWhitespace(decoded);
	if (!cleaned) return null;
	return limitLinkTitle(cleaned, maxLength);
};
