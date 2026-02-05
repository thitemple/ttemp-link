CREATE TABLE "link_click_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"referrer_domain" text,
	"device_type" varchar(32) NOT NULL,
	"browser_name" varchar(64) NOT NULL,
	"browser_version" varchar(64),
	"os_name" varchar(64),
	"os_version" varchar(64),
	"country_code" varchar(2),
	"country_name" varchar(80),
	"region" text,
	"city" text
);
--> statement-breakpoint
ALTER TABLE "link_click_events" ADD CONSTRAINT "link_click_events_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_click_events_link_id_idx" ON "link_click_events" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "link_click_events_created_at_idx" ON "link_click_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "link_click_events_country_code_idx" ON "link_click_events" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "link_click_events_city_idx" ON "link_click_events" USING btree ("city");--> statement-breakpoint
CREATE INDEX "link_click_events_referrer_domain_idx" ON "link_click_events" USING btree ("referrer_domain");--> statement-breakpoint
CREATE INDEX "link_click_events_device_type_idx" ON "link_click_events" USING btree ("device_type");--> statement-breakpoint
CREATE INDEX "link_click_events_browser_name_idx" ON "link_click_events" USING btree ("browser_name");