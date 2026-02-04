import {
	boolean,
	date,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';

export * from './auth-schema';

export const links = pgTable(
	'links',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		slug: varchar('slug', { length: 64 }).notNull(),
		destinationUrl: text('destination_url').notNull(),
		title: text('title'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
		isActive: boolean('is_active').notNull().default(true),
		totalClicks: integer('total_clicks').notNull().default(0),
		createdBy: text('created_by').notNull()
	},
	(table) => ({
		slugUnique: uniqueIndex('links_slug_unique').on(table.slug),
		destinationUnique: uniqueIndex('links_user_destination_unique').on(
			table.createdBy,
			table.destinationUrl
		),
		createdAtIdx: index('links_created_at_idx').on(table.createdAt)
	})
);

export const linkDailyStats = pgTable(
	'link_daily_stats',
	{
		linkId: uuid('link_id')
			.notNull()
			.references(() => links.id, { onDelete: 'cascade' }),
		day: date('day').notNull(),
		clicks: integer('clicks').notNull().default(0)
	},
	(table) => ({
		pk: primaryKey({ columns: [table.linkId, table.day] }),
		dayIdx: index('link_daily_stats_day_idx').on(table.day)
	})
);
