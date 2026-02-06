import { error, redirect } from '@sveltejs/kit';
import { findLinkBySlug, getAnalyticsSettings, getUtcDay, trackLinkClick } from '@ttemp/db/queries';
import {
	normalizeReferrer,
	parseUserAgent,
	resolveClientIpFromHeaders,
	resolveGeoFromHeaders
} from '$lib/analytics';
import { resolveCountryFromGeoLite } from '$lib/geoip';

export async function load({ params, request, setHeaders, getClientAddress }) {
	const link = await findLinkBySlug(params.slug);

	if (!link || !link.isActive) {
		throw error(404, 'Link not found');
	}

	const referrerDomain = normalizeReferrer(request.headers.get('referer'));
	const uaInfo = parseUserAgent(request.headers.get('user-agent'));
	const settings = await getAnalyticsSettings();
	const trackCountry = settings?.trackCountry ?? false;
	const useGeoLiteFallback = trackCountry && (settings?.useGeoLiteFallback ?? false);

	const headerGeo = trackCountry
		? resolveGeoFromHeaders(request.headers)
		: { countryCode: null, countryName: null, region: null, city: null };
	let countryCode = headerGeo.countryCode;
	let countryName = headerGeo.countryName;

	if (trackCountry && !countryCode && useGeoLiteFallback) {
		const fallbackCountry = await resolveCountryFromGeoLite(
			resolveClientIpFromHeaders(request.headers) ?? getClientAddress()
		);
		countryCode = fallbackCountry?.countryCode ?? null;
		countryName = fallbackCountry?.countryName ?? null;
	}

	await trackLinkClick({
		linkId: link.id,
		day: getUtcDay(),
		referrerDomain,
		deviceType: uaInfo.deviceType,
		browserName: uaInfo.browserName,
		browserVersion: uaInfo.browserVersion,
		osName: uaInfo.osName,
		osVersion: uaInfo.osVersion,
		countryCode: trackCountry ? countryCode : null,
		countryName: trackCountry ? countryName : null,
		region: null,
		city: null
	});
	setHeaders({ 'cache-control': 'no-store' });

	throw redirect(302, link.destinationUrl);
}
