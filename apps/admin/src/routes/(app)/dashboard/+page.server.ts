import { PUBLIC_SHORT_BASE_URL } from '$env/static/public';
import { getTopLinksByRange, getTotalClicks } from '@ttemp/db/queries';

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
