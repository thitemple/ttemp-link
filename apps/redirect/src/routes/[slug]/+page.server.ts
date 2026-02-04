import { error, redirect } from '@sveltejs/kit';
import { findLinkBySlug, getUtcDay, incrementClick } from '@ttemp/db/queries';

export async function load({ params, setHeaders }) {
	const link = await findLinkBySlug(params.slug);

	if (!link || !link.isActive) {
		throw error(404, 'Link not found');
	}

	await incrementClick(link.id, getUtcDay());
	setHeaders({ 'cache-control': 'no-store' });

	throw redirect(302, link.destinationUrl);
}
