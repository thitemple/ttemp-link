import { form, getRequestEvent } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { createLink as createLinkRecord, findLinkByDestinationForUser } from '@ttemp/db/queries';
import * as v from 'valibot';
import { resolveCreateSlug } from '$lib/server/link-create';
import { normalizeDestinationUrl } from '$lib/server/link-utils';
import { fetchPageTitle } from '$lib/server/link-metadata';

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

	const destinationUrl = normalizeDestinationUrl(destinationInput);
	if (!destinationUrl) {
		invalid(issue.destination('Destination URL must be a valid http(s) address.'));
	}

	const existingDestination = await findLinkByDestinationForUser(locals.user.id, destinationUrl);
	if (existingDestination) {
		invalid(issue.destination('You already have a link for that destination URL.'));
	}

	const slugResult = await resolveCreateSlug(rawSlug);
	if (!slugResult.ok) {
		invalid(issue.slug(slugResult.message));
	}

	const fetchedTitle = titleInput === '' ? await fetchPageTitle(destinationUrl) : null;
	const title = titleInput === '' ? fetchedTitle : titleInput;

	const record = await createLinkRecord({
		slug: slugResult.slug,
		destinationUrl,
		title: title === '' ? null : title,
		createdBy: locals.user.id
	});

	if (!record) {
		invalid('Unable to create the short link. Please try again.');
	}

	return {
		message: 'Link created successfully.',
		createdSlug: slugResult.slug,
		createdId: record.id
	};
});
