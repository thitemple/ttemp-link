import { PUBLIC_SHORT_BASE_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';
import { createLink, getTopLinksByRange, getTotalClicks } from '@ttemp/db/queries';
import { resolveCreateSlug } from '$lib/server/link-create';
import { normalizeDestinationUrl } from '$lib/server/link-utils';

const VALID_RANGES = new Set([7, 15, 30]);

export async function load({ url }) {
	const rangeParam = Number(url.searchParams.get('range') ?? '7');
	const range = VALID_RANGES.has(rangeParam) ? rangeParam : 7;

	const [topLinks, totalClicks] = await Promise.all([
		getTopLinksByRange(range),
		getTotalClicks()
	]);

	return {
		range,
		topLinks,
		totalClicks,
		shortBaseUrl: PUBLIC_SHORT_BASE_URL
	};
}

export const actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be signed in to create links.' });
		}

		const data = await request.formData();
		const destinationInput = String(data.get('destination') ?? '').trim();
		const rawSlug = String(data.get('slug') ?? '').trim();

		const destinationUrl = normalizeDestinationUrl(destinationInput);
		if (!destinationUrl) {
			return fail(400, {
				message: 'Destination URL must be a valid http(s) address.',
				values: { destination: destinationInput, slug: rawSlug }
			});
		}

		const slugResult = await resolveCreateSlug(rawSlug);
		if (!slugResult.ok) {
			return fail(400, {
				message: slugResult.message,
				values: { destination: destinationInput, slug: rawSlug }
			});
		}

		await createLink({
			slug: slugResult.slug,
			destinationUrl,
			title: null,
			createdBy: locals.user.id
		});

		return { success: true, message: 'Link created.', createdSlug: slugResult.slug };
	}
};
