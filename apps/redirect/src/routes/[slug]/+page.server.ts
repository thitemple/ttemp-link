import { error, redirect } from '@sveltejs/kit';
import { findLinkBySlug, getUtcDay, trackLinkClick } from '@ttemp/db/queries';
import { normalizeReferrer, parseUserAgent, resolveGeoFromHeaders } from '$lib/analytics';

export async function load({ params, request, setHeaders }) {
	const link = await findLinkBySlug(params.slug);

	if (!link || !link.isActive) {
		throw error(404, 'Link not found');
	}

	const referrerDomain = normalizeReferrer(request.headers.get('referer'));
	const uaInfo = parseUserAgent(request.headers.get('user-agent'));
	const geoInfo = resolveGeoFromHeaders(request.headers);

	await trackLinkClick({
		linkId: link.id,
		day: getUtcDay(),
		referrerDomain,
		deviceType: uaInfo.deviceType,
		browserName: uaInfo.browserName,
		browserVersion: uaInfo.browserVersion,
		osName: uaInfo.osName,
		osVersion: uaInfo.osVersion,
		countryCode: geoInfo.countryCode,
		countryName: geoInfo.countryName,
		region: geoInfo.region,
		city: geoInfo.city
	});
	setHeaders({ 'cache-control': 'no-store' });

	throw redirect(302, link.destinationUrl);
}
