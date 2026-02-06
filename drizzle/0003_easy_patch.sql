CREATE TABLE "analytics_settings" (
	"id" varchar(32) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"track_country" boolean DEFAULT false NOT NULL,
	"use_geolite_fallback" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geoip_country_db" (
	"id" varchar(32) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"mmdb" "bytea" NOT NULL,
	"source_url" text NOT NULL,
	"etag" text,
	"last_modified_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_at" timestamp with time zone,
	"latest_last_modified_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analytics_settings_updated_at_idx" ON "analytics_settings" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "geoip_country_db_updated_at_idx" ON "geoip_country_db" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "geoip_country_db_fetched_at_idx" ON "geoip_country_db" USING btree ("fetched_at");