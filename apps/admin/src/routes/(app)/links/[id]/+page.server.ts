import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
import { error, fail, redirect } from "@sveltejs/kit";
import {
	deleteLink,
	findLinkByDestinationForUser,
	findLinkById,
	findLinkBySlug,
	getLinkRangeStats,
	updateLink,
} from "@ttemp/db/queries";
import { isValidSlug, normalizeSlug } from "@ttemp/db/slug";
import { normalizeDestinationUrl } from "$lib/server/link-utils";

export async function load({ params }) {
	const link = await findLinkById(params.id);

	if (!link) {
		throw error(404, "Link not found");
	}

	const stats = await getLinkRangeStats(link.id, 7);

	return {
		link,
		stats,
		shortBaseUrl: PUBLIC_SHORTLINK_BASE_URL,
	};
}

export const actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { message: "You must be signed in to update links." });
		}

		const data = await request.formData();
		const destinationInput = String(data.get("destination") ?? "").trim();
		const title = String(data.get("title") ?? "").trim() || null;
		const rawSlug = String(data.get("slug") ?? "").trim();
		const isActive = data.get("isActive") === "on";

		const destinationUrl = normalizeDestinationUrl(destinationInput);
		if (!destinationUrl) {
			return fail(400, {
				message: "Destination URL must be a valid http(s) address.",
				values: { destination: destinationInput, title, slug: rawSlug, isActive },
			});
		}

		const existingDestination = await findLinkByDestinationForUser(locals.user.id, destinationUrl);
		if (existingDestination && existingDestination.id !== params.id) {
			return fail(400, {
				message: "You already have a link for that destination URL.",
				values: { destination: destinationInput, title, slug: rawSlug, isActive },
			});
		}

		const slug = normalizeSlug(rawSlug);
		if (!slug || !isValidSlug(slug)) {
			return fail(400, {
				message: "Slug can only use letters, numbers, underscores, or dashes.",
				values: { destination: destinationInput, title, slug: rawSlug, isActive },
			});
		}

		const existing = await findLinkBySlug(slug);
		if (existing && existing.id !== params.id) {
			return fail(400, {
				message: "That slug is already taken.",
				values: { destination: destinationInput, title, slug, isActive },
			});
		}

		await updateLink(params.id, {
			slug,
			destinationUrl,
			title,
			isActive,
		});

		return { success: true };
	},
	delete: async ({ params }) => {
		await deleteLink(params.id);
		throw redirect(302, "/links");
	},
};
