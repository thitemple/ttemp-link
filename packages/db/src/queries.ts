import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from './index';
import { analyticsSettings, geoipCountryDb, linkClickEvents, linkDailyStats, links } from './schema';

export async function createLink(input: {
	slug: string;
	destinationUrl: string;
	title?: string | null;
	tags?: string[];
	createdBy: string;
}) {
	const [record] = await db
		.insert(links)
		.values({
			slug: input.slug,
			destinationUrl: input.destinationUrl,
			title: input.title ?? null,
			tags: input.tags ?? [],
			createdBy: input.createdBy
		})
		.returning();

	return record ?? null;
}

export async function updateLink(
	id: string,
	input: Partial<{
		slug: string;
		destinationUrl: string;
		title: string | null;
		tags: string[];
		isActive: boolean;
	}>
) {
	const [record] = await db
		.update(links)
		.set({
			...input,
			updatedAt: new Date()
		})
		.where(eq(links.id, id))
		.returning();

	return record ?? null;
}

export async function deleteLink(id: string) {
	const [record] = await db.delete(links).where(eq(links.id, id)).returning();
	return record ?? null;
}

export async function findLinkBySlug(slug: string) {
	return (
		(await db.select().from(links).where(eq(links.slug, slug)).limit(1))[0] ?? null
	);
}

export async function findLinkByDestinationForUser(createdBy: string, destinationUrl: string) {
	return (
		(await db
			.select()
			.from(links)
			.where(and(eq(links.createdBy, createdBy), eq(links.destinationUrl, destinationUrl)))
			.limit(1))[0] ?? null
	);
}

export async function findLinkById(id: string) {
	return (
		(await db.select().from(links).where(eq(links.id, id)).limit(1))[0] ?? null
	);
}

export async function listLinks() {
	return db.select().from(links).orderBy(desc(links.createdAt));
}

export async function incrementClick(linkId: string, day: string) {
	await db.transaction(async (tx) => {
		await tx
			.insert(linkDailyStats)
			.values({ linkId, day, clicks: 1 })
			.onConflictDoUpdate({
				target: [linkDailyStats.linkId, linkDailyStats.day],
				set: { clicks: sql`${linkDailyStats.clicks} + 1` }
			});

		await tx
			.update(links)
			.set({ totalClicks: sql`${links.totalClicks} + 1` })
			.where(eq(links.id, linkId));
	});
}

export async function trackLinkClick(input: {
	linkId: string;
	day: string;
	referrerDomain?: string | null;
	deviceType: string;
	browserName: string;
	browserVersion?: string | null;
	osName?: string | null;
	osVersion?: string | null;
	countryCode?: string | null;
	countryName?: string | null;
	region?: string | null;
	city?: string | null;
}) {
	await db.transaction(async (tx) => {
		await tx.insert(linkClickEvents).values({
			linkId: input.linkId,
			referrerDomain: input.referrerDomain ?? null,
			deviceType: input.deviceType,
			browserName: input.browserName,
			browserVersion: input.browserVersion ?? null,
			osName: input.osName ?? null,
			osVersion: input.osVersion ?? null,
			countryCode: input.countryCode ?? null,
			countryName: input.countryName ?? null,
			region: input.region ?? null,
			city: input.city ?? null
		});

		await tx
			.insert(linkDailyStats)
			.values({ linkId: input.linkId, day: input.day, clicks: 1 })
			.onConflictDoUpdate({
				target: [linkDailyStats.linkId, linkDailyStats.day],
				set: { clicks: sql`${linkDailyStats.clicks} + 1` }
			});

		await tx
			.update(links)
			.set({ totalClicks: sql`${links.totalClicks} + 1` })
			.where(eq(links.id, input.linkId));
	});
}

const SETTINGS_ID = 'default';

export async function getAnalyticsSettings() {
	const [existing] = await db
		.select()
		.from(analyticsSettings)
		.where(eq(analyticsSettings.id, SETTINGS_ID))
		.limit(1);

	if (existing) return existing;

	const [created] = await db
		.insert(analyticsSettings)
		.values({ id: SETTINGS_ID })
		.onConflictDoNothing()
		.returning();

	if (created) return created;

	const [fallback] = await db
		.select()
		.from(analyticsSettings)
		.where(eq(analyticsSettings.id, SETTINGS_ID))
		.limit(1);

	return fallback ?? null;
}

export async function upsertAnalyticsSettings(input: {
	trackCountry: boolean;
	useGeoLiteFallback: boolean;
	maxmindLicenseKey?: string | null;
}) {
	const updateSet: {
		trackCountry: boolean;
		useGeoLiteFallback: boolean;
		updatedAt: Date;
		maxmindLicenseKey?: string | null;
	} = {
		trackCountry: input.trackCountry,
		useGeoLiteFallback: input.useGeoLiteFallback,
		updatedAt: new Date()
	};
	if (input.maxmindLicenseKey !== undefined) {
		updateSet.maxmindLicenseKey = input.maxmindLicenseKey;
	}

	const [record] = await db
		.insert(analyticsSettings)
		.values({
			id: SETTINGS_ID,
			trackCountry: input.trackCountry,
			useGeoLiteFallback: input.useGeoLiteFallback,
			maxmindLicenseKey: input.maxmindLicenseKey ?? null,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: analyticsSettings.id,
			set: updateSet
		})
		.returning();

	return record ?? null;
}

export async function getGeoipCountryDb() {
	const [record] = await db
		.select()
		.from(geoipCountryDb)
		.where(eq(geoipCountryDb.id, SETTINGS_ID))
		.limit(1);

	return record ?? null;
}

export async function saveGeoipCountryDb(input: {
	mmdb: Uint8Array;
	sourceUrl: string;
	etag?: string | null;
	lastModifiedAt?: Date | null;
	latestLastModifiedAt?: Date | null;
}) {
	const now = new Date();
	const [record] = await db
		.insert(geoipCountryDb)
		.values({
			id: SETTINGS_ID,
			mmdb: input.mmdb,
			sourceUrl: input.sourceUrl,
			etag: input.etag ?? null,
			lastModifiedAt: input.lastModifiedAt ?? null,
			latestLastModifiedAt: input.latestLastModifiedAt ?? input.lastModifiedAt ?? null,
			fetchedAt: now,
			checkedAt: now,
			updatedAt: now
		})
		.onConflictDoUpdate({
			target: geoipCountryDb.id,
			set: {
				mmdb: input.mmdb,
				sourceUrl: input.sourceUrl,
				etag: input.etag ?? null,
				lastModifiedAt: input.lastModifiedAt ?? null,
				latestLastModifiedAt: input.latestLastModifiedAt ?? input.lastModifiedAt ?? null,
				fetchedAt: now,
				checkedAt: now,
				updatedAt: now
			}
		})
		.returning();

	return record ?? null;
}

export async function saveGeoipCountryDbCheck(input: {
	latestLastModifiedAt?: Date | null;
	etag?: string | null;
	sourceUrl?: string | null;
	checkedAt?: Date;
}) {
	const now = input.checkedAt ?? new Date();
	const updateSet: {
		sourceUrl?: string;
		etag?: string | null;
		latestLastModifiedAt?: Date | null;
		checkedAt: Date;
		updatedAt: Date;
	} = {
		checkedAt: now,
		updatedAt: now
	};
	if (typeof input.sourceUrl === 'string' && input.sourceUrl.trim()) {
		updateSet.sourceUrl = input.sourceUrl.trim();
	}
	if (input.etag !== undefined) {
		updateSet.etag = input.etag;
	}
	if (input.latestLastModifiedAt !== undefined) {
		updateSet.latestLastModifiedAt = input.latestLastModifiedAt;
	}

	const [record] = await db
		.update(geoipCountryDb)
		.set(updateSet)
		.where(eq(geoipCountryDb.id, SETTINGS_ID))
		.returning();

	return record ?? null;
}

export async function getTopLinksByRange(rangeDays: number) {
	const startDate = getRangeStartDate(rangeDays);
	const totalClicksSql = sql<number>`sum(${linkDailyStats.clicks})`;

	return db
		.select({
			id: links.id,
			slug: links.slug,
			destinationUrl: links.destinationUrl,
			title: links.title,
			isActive: links.isActive,
			clicks: totalClicksSql
		})
		.from(linkDailyStats)
		.innerJoin(links, eq(linkDailyStats.linkId, links.id))
		.where(gte(linkDailyStats.day, startDate))
		.groupBy(links.id, links.slug, links.destinationUrl, links.title, links.isActive)
		.orderBy(desc(totalClicksSql))
		.limit(10);
}

export async function getTotalClicks() {
	const [row] = await db
		.select({ total: sql<number>`coalesce(sum(${links.totalClicks}), 0)` })
		.from(links);
	return row?.total ?? 0;
}

export async function getLinkRangeStats(linkId: string, rangeDays = 7) {
	const currentStart = getRangeStartDate(rangeDays);
	const previousStart = getRangeStartDate(rangeDays * 2);
	const totalClicksSql = sql<number>`coalesce(sum(${linkDailyStats.clicks}), 0)`;

	const [current] = await db
		.select({ total: totalClicksSql })
		.from(linkDailyStats)
		.where(and(eq(linkDailyStats.linkId, linkId), gte(linkDailyStats.day, currentStart)));

	const [previous] = await db
		.select({ total: totalClicksSql })
		.from(linkDailyStats)
		.where(
			and(
				eq(linkDailyStats.linkId, linkId),
				gte(linkDailyStats.day, previousStart),
				lt(linkDailyStats.day, currentStart)
			)
		);

	return {
		lastRangeClicks: current?.total ?? 0,
		previousRangeClicks: previous?.total ?? 0
	};
}

export async function getClicksByDay(rangeDays: number, linkId?: string) {
	const startDate = getRangeStartDate(rangeDays);
	const conditions = linkId
		? and(eq(linkDailyStats.linkId, linkId), gte(linkDailyStats.day, startDate))
		: gte(linkDailyStats.day, startDate);

	return db
		.select({
			day: linkDailyStats.day,
			clicks: sql<number>`sum(${linkDailyStats.clicks})`
		})
		.from(linkDailyStats)
		.where(conditions)
		.groupBy(linkDailyStats.day)
		.orderBy(linkDailyStats.day);
}

export async function getRangeTotalClicks(rangeDays: number, linkId?: string) {
	const startDate = getRangeStartDate(rangeDays);
	const totalClicksSql = sql<number>`coalesce(sum(${linkDailyStats.clicks}), 0)`;
	const conditions = linkId
		? and(eq(linkDailyStats.linkId, linkId), gte(linkDailyStats.day, startDate))
		: gte(linkDailyStats.day, startDate);

	const [row] = await db
		.select({ total: totalClicksSql })
		.from(linkDailyStats)
		.where(conditions);

	return row?.total ?? 0;
}

export async function getDeviceBreakdown(rangeDays: number, linkId?: string) {
	return getClickEventBreakdown({
		rangeDays,
		linkId,
		select: { device: linkClickEvents.deviceType },
		groupBy: [linkClickEvents.deviceType]
	});
}

export async function getBrowserBreakdown(rangeDays: number, linkId?: string) {
	return getClickEventBreakdown({
		rangeDays,
		linkId,
		select: { browser: linkClickEvents.browserName },
		groupBy: [linkClickEvents.browserName]
	});
}

export async function getReferrerBreakdown(rangeDays: number, linkId?: string) {
	const referrerSql = sql<string>`coalesce(${linkClickEvents.referrerDomain}, 'Direct')`;
	return getClickEventBreakdown({
		rangeDays,
		linkId,
		select: { referrer: referrerSql },
		groupBy: [referrerSql]
	});
}

export async function getCountryBreakdown(rangeDays: number, linkId?: string) {
	return getClickEventBreakdown({
		rangeDays,
		linkId,
		select: {
			countryCode: linkClickEvents.countryCode,
			countryName: linkClickEvents.countryName
		},
		groupBy: [linkClickEvents.countryCode, linkClickEvents.countryName]
	});
}

export async function getCityBreakdown(rangeDays: number, linkId?: string) {
	return getClickEventBreakdown({
		rangeDays,
		linkId,
		select: {
			city: linkClickEvents.city,
			countryName: linkClickEvents.countryName
		},
		groupBy: [linkClickEvents.city, linkClickEvents.countryName]
	});
}

export function getRangeStartDate(rangeDays: number) {
	const today = new Date();
	const utcYear = today.getUTCFullYear();
	const utcMonth = today.getUTCMonth();
	const utcDate = today.getUTCDate();
	const startDate = new Date(Date.UTC(utcYear, utcMonth, utcDate - (rangeDays - 1)));
	return startDate.toISOString().slice(0, 10);
}

export function getUtcDay(date = new Date()) {
	const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	return utcDate.toISOString().slice(0, 10);
}

function getRangeStartTimestamp(rangeDays: number) {
	const today = new Date();
	const utcStart = new Date(
		Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (rangeDays - 1))
	);
	return utcStart;
}

function getClickEventRangeCondition(rangeDays: number, linkId?: string) {
	const startDate = getRangeStartTimestamp(rangeDays);
	return linkId
		? and(eq(linkClickEvents.linkId, linkId), gte(linkClickEvents.createdAt, startDate))
		: gte(linkClickEvents.createdAt, startDate);
}

async function getClickEventBreakdown(input: {
	rangeDays: number;
	linkId?: string;
	select: Record<string, unknown>;
	groupBy: unknown[];
}) {
	const clicksSql = sql<number>`count(*)`;
	const rows = await db
		.select({ ...input.select, clicks: clicksSql })
		.from(linkClickEvents)
		.where(getClickEventRangeCondition(input.rangeDays, input.linkId))
		.groupBy(...(input.groupBy as any[]))
		.orderBy(desc(clicksSql));

	return rows;
}
