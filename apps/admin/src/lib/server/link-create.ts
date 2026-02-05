import { findLinkBySlug } from "@ttemp/db/queries";
import { generateSlug, isValidSlug, normalizeSlug } from "@ttemp/db/slug";

const MAX_SLUG_ATTEMPTS = 5;

export type SlugResolution = { ok: true; slug: string } | { ok: false; message: string };

export async function resolveCreateSlug(rawSlug: string): Promise<SlugResolution> {
	const normalized = normalizeSlug(rawSlug);

	if (normalized) {
		if (!isValidSlug(normalized)) {
			return { ok: false, message: "Slug can only use letters, numbers, underscores, or dashes." };
		}

		const existing = await findLinkBySlug(normalized);
		if (existing) {
			return { ok: false, message: "That slug is already taken." };
		}

		return { ok: true, slug: normalized };
	}

	for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
		const candidate = generateSlug(7);
		const existing = await findLinkBySlug(candidate);
		if (!existing) {
			return { ok: true, slug: candidate };
		}
	}

	return { ok: false, message: "Unable to generate a unique slug. Try again." };
}
