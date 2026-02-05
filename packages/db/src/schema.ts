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

export const linkClickEvents = pgTable(
	'link_click_events',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		linkId: uuid('link_id')
			.notNull()
			.references(() => links.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		referrerDomain: text('referrer_domain'),
		deviceType: varchar('device_type', { length: 32 }).notNull(),
		browserName: varchar('browser_name', { length: 64 }).notNull(),
		browserVersion: varchar('browser_version', { length: 64 }),
		osName: varchar('os_name', { length: 64 }),
		osVersion: varchar('os_version', { length: 64 }),
		countryCode: varchar('country_code', { length: 2 }),
		countryName: varchar('country_name', { length: 80 }),
		region: text('region'),
		city: text('city')
	},
	(table) => ({
		linkIdIdx: index('link_click_events_link_id_idx').on(table.linkId),
		createdAtIdx: index('link_click_events_created_at_idx').on(table.createdAt),
		countryCodeIdx: index('link_click_events_country_code_idx').on(table.countryCode),
		cityIdx: index('link_click_events_city_idx').on(table.city),
		referrerDomainIdx: index('link_click_events_referrer_domain_idx').on(table.referrerDomain),
		deviceTypeIdx: index('link_click_events_device_type_idx').on(table.deviceType),
		browserNameIdx: index('link_click_events_browser_name_idx').on(table.browserName)
	})
);
