import { query } from "$app/server";
import { error } from "@sveltejs/kit";
import { findLinkById, getLinkRangeStats, listLinks } from "@ttemp/db/queries";
import * as v from "valibot";

const linkIdSchema = v.object({
	id: v.string(),
});

export const getLinkList = query(async () => {
	const links = await listLinks();
	return { links };
});

export const getLinkById = query(linkIdSchema, async ({ id }) => {
	const link = await findLinkById(id);
	if (!link) {
		error(404, "Link not found");
	}
	const stats = await getLinkRangeStats(link.id, 7);
	return { link, stats };
});
