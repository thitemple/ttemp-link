import { desc, eq, gte, sql } from 'drizzle-orm';
import { db } from './index';
import { linkDailyStats, links } from './schema';

export async function createLink(input: {
	slug: string;
	destinationUrl: string;
	title?: string | null;
	createdBy: string;
}) {
	const [record] = await db
		.insert(links)
		.values({
			slug: input.slug,
			destinationUrl: input.destinationUrl,
			title: input.title ?? null,
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
