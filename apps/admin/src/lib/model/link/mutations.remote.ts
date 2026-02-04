import { form, getRequestEvent } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { createLink as createLinkRecord } from '@ttemp/db/queries';
import * as v from 'valibot';
import { resolveCreateSlug } from '$lib/server/link-create';
import { normalizeDestinationUrl } from '$lib/server/link-utils';

const createLinkSchema = v.object({
	destination: v.string(),
	slug: v.optional(v.string()),
	title: v.optional(v.string())
});

export const createLink = form(createLinkSchema, async (data, issue) => {
	const { locals } = getRequestEvent();

	if (!locals.user) {
		invalid('You must be signed in to create links.');
	}

	const destinationInput = data.destination.trim();
	const rawSlug = (data.slug ?? '').trim();
	const titleInput = (data.title ?? '').trim();
	const title = titleInput === '' ? null : titleInput;

	const destinationUrl = normalizeDestinationUrl(destinationInput);
	if (!destinationUrl) {
		invalid(issue.destination('Destination URL must be a valid http(s) address.'));
	}

	const slugResult = await resolveCreateSlug(rawSlug);
	if (!slugResult.ok) {
		invalid(issue.slug(slugResult.message));
	}

	await createLinkRecord({
		slug: slugResult.slug,
		destinationUrl,
		title,
		createdBy: locals.user.id
	});

	return {
		message: 'Link created successfully.',
		createdSlug: slugResult.slug
	};
});
