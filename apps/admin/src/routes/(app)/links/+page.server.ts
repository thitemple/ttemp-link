import { PUBLIC_SHORTLINK_BASE_URL } from "$env/static/public";
import { listLinks } from "@ttemp/db/queries";

export async function load() {
	const links = await listLinks();

	return {
		links,
		shortBaseUrl: PUBLIC_SHORTLINK_BASE_URL,
	};
}
