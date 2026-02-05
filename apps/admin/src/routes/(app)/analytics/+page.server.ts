import {
	getBrowserBreakdown,
	getCityBreakdown,
	getClicksByDay,
	getCountryBreakdown,
	getDeviceBreakdown,
	getRangeTotalClicks,
	getReferrerBreakdown,
	listLinks,
} from "@ttemp/db/queries";

const VALID_RANGES = new Set([7, 30, 90]);

type ClicksByDayRow = { day: string | Date; clicks: number };
type DeviceRow = { device: string | null; clicks: number };
type BrowserRow = { browser: string | null; clicks: number };
type ReferrerRow = { referrer: string | null; clicks: number };
type CountryRow = { countryCode: string | null; countryName: string | null; clicks: number };
type CityRow = { city: string | null; countryName: string | null; clicks: number };

const getRangeStart = (rangeDays: number) => {
	const today = new Date();
	const utcStart = new Date(
		Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (rangeDays - 1)),
	);
	return utcStart;
};

export async function load({ url }) {
	const rangeParam = Number(url.searchParams.get("range") ?? "30");
	const range = VALID_RANGES.has(rangeParam) ? rangeParam : 30;
	const linkParam = (url.searchParams.get("link") ?? "").trim();

	const links = await listLinks();
	const linkId = linkParam && links.some((link) => link.id === linkParam) ? linkParam : null;
	const normalizeClicks = <T extends { clicks: unknown }>(rows: T[]) =>
		rows.map((row) => ({ ...row, clicks: Number(row.clicks ?? 0) })) as Array<
			Omit<T, "clicks"> & { clicks: number }
		>;

	const [
		rawClicksByDay,
		rawRangeTotalClicks,
		rawDevices,
		rawBrowsers,
		rawReferrers,
		rawCountries,
		rawCities,
	] = (await Promise.all([
		getClicksByDay(range, linkId ?? undefined),
		getRangeTotalClicks(range, linkId ?? undefined),
		getDeviceBreakdown(range, linkId ?? undefined),
		getBrowserBreakdown(range, linkId ?? undefined),
		getReferrerBreakdown(range, linkId ?? undefined),
		getCountryBreakdown(range, linkId ?? undefined),
		getCityBreakdown(range, linkId ?? undefined),
	])) as [
		ClicksByDayRow[],
		number,
		DeviceRow[],
		BrowserRow[],
		ReferrerRow[],
		CountryRow[],
		CityRow[],
	];

	const clicksByDay = rawClicksByDay.map((entry) => ({
		day: typeof entry.day === "string" ? entry.day : entry.day.toISOString().slice(0, 10),
		clicks: Number(entry.clicks ?? 0),
	}));
	const rangeTotalClicks = Number(rawRangeTotalClicks ?? 0);
	const devices = normalizeClicks(rawDevices);
	const browsers = normalizeClicks(rawBrowsers);
	const referrers = normalizeClicks(rawReferrers);
	const countries = normalizeClicks(rawCountries);
	const cities = normalizeClicks(rawCities);

	const topDay = clicksByDay.reduce((acc, entry) => (entry.clicks > acc.clicks ? entry : acc), {
		day: "",
		clicks: 0,
	});
	const topCountries = [...countries]
		.filter((entry) => entry.countryName)
		.sort((a, b) => b.clicks - a.clicks)
		.slice(0, 2);

	const rangeStart = getRangeStart(range);
	const rangeEnd = new Date();

	return {
		range,
		linkId,
		links,
		clicksByDay,
		rangeTotalClicks,
		devices,
		browsers,
		referrers,
		countries,
		cities,
		topDay,
		topCountries,
		rangeStart: rangeStart.toISOString(),
		rangeEnd: rangeEnd.toISOString(),
	};
}
