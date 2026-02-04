CREATE UNIQUE INDEX "links_user_destination_unique" ON "links" USING btree ("created_by", "destination_url");--> statement-breakpoint
