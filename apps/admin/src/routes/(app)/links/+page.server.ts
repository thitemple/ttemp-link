import { PUBLIC_SHORT_BASE_URL } from '$env/static/public';
import { fail } from '@sveltejs/kit';
import { createLink, deleteLink, listLinks } from '@ttemp/db/queries';
import { resolveCreateSlug } from '$lib/server/link-create';
import { normalizeDestinationUrl } from '$lib/server/link-utils';

export async function load() {
	const links = await listLinks();

	return {
		links,
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
		const title = String(data.get('title') ?? '').trim() || null;
		const rawSlug = String(data.get('slug') ?? '').trim();

		const destinationUrl = normalizeDestinationUrl(destinationInput);
		if (!destinationUrl) {
			return fail(400, {
				message: 'Destination URL must be a valid http(s) address.',
				values: { destination: destinationInput, title, slug: rawSlug }
			});
		}

		const slugResult = await resolveCreateSlug(rawSlug);
		if (!slugResult.ok) {
			return fail(400, {
				message: slugResult.message,
				values: { destination: destinationInput, title, slug: rawSlug }
			});
		}

		const { slug } = slugResult;

		await createLink({
			slug,
			destinationUrl,
			title,
			createdBy: locals.user.id
		});

		return { success: true };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '').trim();

		if (!id) {
			return fail(400, { message: 'Link id is required.' });
		}

		await deleteLink(id);
		return { success: true };
	}
};
