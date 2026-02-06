import { query } from "$app/server";
import {
	getAnalyticsSettings,
	getBrowserBreakdown,
	getClicksByDay,
	getCountryBreakdown,
	getDeviceBreakdown,
	getRangeTotalClicks,
	getReferrerBreakdown,
	getTopLinksByRange,
	getTotalClicks,
	listLinks,
} from "@ttemp/db/queries";
import * as v from "valibot";

const VALID_DASHBOARD_RANGES = new Set([7, 15, 30]);

const dashboardArgSchema = v.object({
	range: v.number(),
});

export const getDashboardData = query(dashboardArgSchema, async ({ range }) => {
	const validRange = VALID_DASHBOARD_RANGES.has(range) ? range : 7;
	const [topLinks, totalClicks] = await Promise.all([
		getTopLinksByRange(validRange),
		getTotalClicks(),
	]);
	return { range: validRange, topLinks, totalClicks };
});

type ClicksByDayRow = { day: string | Date; clicks: number };
type DeviceRow = { device: string | null; clicks: number };
type BrowserRow = { browser: string | null; clicks: number };
type ReferrerRow = { referrer: string | null; clicks: number };
type CountryRow = { countryCode: string | null; countryName: string | null; clicks: number };

const VALID_ANALYTICS_RANGES = new Set([7, 30, 90]);

const analyticsArgSchema = v.object({
	range: v.number(),
	linkId: v.optional(v.nullable(v.string())),
});

const getRangeStart = (rangeDays: number) => {
	const today = new Date();
	return new Date(
		Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (rangeDays - 1)),
	);
};

export const getAnalyticsData = query(analyticsArgSchema, async ({ range, linkId }) => {
	const validRange = VALID_ANALYTICS_RANGES.has(range) ? range : 30;
	const linkParam = (linkId ?? "").trim();

	const [links, settings] = await Promise.all([listLinks(), getAnalyticsSettings()]);
	const showCountryAnalytics = settings?.trackCountry ?? false;
	const resolvedLinkId =
		linkParam && links.some((link) => link.id === linkParam) ? linkParam : null;

	const normalizeClicks = <T extends { clicks: unknown }>(rows: T[]) =>
		rows.map((row) => ({ ...row, clicks: Number(row.clicks ?? 0) })) as Array<
			Omit<T, "clicks"> & { clicks: number }
		>;

	const [rawClicksByDay, rawRangeTotalClicks, rawDevices, rawBrowsers, rawReferrers, rawCountries] =
		(await Promise.all([
			getClicksByDay(validRange, resolvedLinkId ?? undefined),
			getRangeTotalClicks(validRange, resolvedLinkId ?? undefined),
			getDeviceBreakdown(validRange, resolvedLinkId ?? undefined),
			getBrowserBreakdown(validRange, resolvedLinkId ?? undefined),
			getReferrerBreakdown(validRange, resolvedLinkId ?? undefined),
			showCountryAnalytics
				? getCountryBreakdown(validRange, resolvedLinkId ?? undefined)
				: Promise.resolve([]),
		])) as [ClicksByDayRow[], number, DeviceRow[], BrowserRow[], ReferrerRow[], CountryRow[]];

	const clicksByDay = rawClicksByDay.map((entry) => ({
		day: typeof entry.day === "string" ? entry.day : entry.day.toISOString().slice(0, 10),
		clicks: Number(entry.clicks ?? 0),
	}));
	const rangeTotalClicks = Number(rawRangeTotalClicks ?? 0);
	const devices = normalizeClicks(rawDevices);
	const browsers = normalizeClicks(rawBrowsers);
	const referrers = normalizeClicks(rawReferrers);
	const countries = normalizeClicks(rawCountries);

	const topDay = clicksByDay.reduce((acc, entry) => (entry.clicks > acc.clicks ? entry : acc), {
		day: "",
		clicks: 0,
	});
	const topCountries = [...countries]
		.filter((entry) => entry.countryName)
		.sort((a, b) => b.clicks - a.clicks)
		.slice(0, 2);

	const rangeStart = getRangeStart(validRange);
	const rangeEnd = new Date();

	return {
		range: validRange,
		linkId: resolvedLinkId,
		links,
		clicksByDay,
		rangeTotalClicks,
		devices,
		browsers,
		referrers,
		countries,
		showCountryAnalytics,
		topDay,
		topCountries,
		rangeStart: rangeStart.toISOString(),
		rangeEnd: rangeEnd.toISOString(),
	};
});
